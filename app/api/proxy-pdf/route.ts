import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Extracts the public_id from a Cloudinary secure_url.
 * Example URL: https://res.cloudinary.com/<cloud>/raw/upload/v12345/resumes/file.pdf
 * The public_id would be: resumes/file.pdf  (without version prefix)
 */
function extractCloudinaryInfo(url: string): { publicId: string, type: string, resourceType: string, version?: string } | null {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split("/");
    
    // Find the delivery type segment index
    const typeIdx = parts.findIndex((p) => p === "upload" || p === "authenticated" || p === "private");
    if (typeIdx === -1) return null;
    
    const type = parts[typeIdx];
    // The resource type (image, raw, video) is usually right before the delivery type
    const resourceType = typeIdx > 0 ? parts[typeIdx - 1] : "raw";
    
    let startIdx = typeIdx + 1;
    let version: string | undefined;
    if (/^v\d+$/.test(parts[startIdx])) {
      version = parts[startIdx].substring(1); // extract the digits after 'v'
      startIdx++;
    }
    
    const publicId = parts.slice(startIdx).join("/");
    return { publicId, type, resourceType, version };
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const targetUrl = searchParams.get("url");
    const download = searchParams.get("download");
    const filename = searchParams.get("filename") || "document.pdf";

    if (!targetUrl) {
      return NextResponse.json(
        { error: "Missing url parameter" },
        { status: 400 }
      );
    }

    // --- Attempt 1: Direct fetch (works if the resource is truly public) ---
    console.log(`[proxy-pdf] Attempt 1: Direct fetch to ${targetUrl}`);
    let upstream = await fetch(targetUrl, {
      headers: { Accept: "*/*" },
    });

    // --- Attempt 2: If 401/403, generate a signed Cloudinary URL and retry ---
    if (upstream.status === 401 || upstream.status === 403) {
      console.log(`[proxy-pdf] Direct fetch failed with ${upstream.status}, trying signed URL...`);
      const info = extractCloudinaryInfo(targetUrl);
      console.log(`[proxy-pdf] Extracted info:`, info);

      if (info?.publicId && process.env.CLOUDINARY_API_SECRET) {
        // Cloudinary restricts raw PDF delivery on free tiers by default, returning 401.
        // We use private_download_url to generate an authenticated API download link that bypasses this restriction.
        const signedUrl = cloudinary.utils.private_download_url(info.publicId, "", {
          resource_type: info.resourceType,
          type: info.type,
        });
        
        console.log(`[proxy-pdf] Signed URL generated:`, signedUrl);

        upstream = await fetch(signedUrl, {
          headers: { Accept: "*/*" },
        });
        
        console.log(`[proxy-pdf] Signed URL fetch status:`, upstream.status);
      } else {
        console.log(`[proxy-pdf] Could not extract publicId or missing API secret`);
      }
    }

    if (!upstream.ok) {
      const text = await upstream.text().catch(() => "");
      return NextResponse.json(
        {
          error: "Upstream fetch failed",
          status: upstream.status,
          details: text.slice(0, 500),
        },
        { status: 502 }
      );
    }

    const arrayBuffer = await upstream.arrayBuffer();
    const headers = new Headers();
    headers.set(
      "Content-Type",
      upstream.headers.get("Content-Type") || "application/pdf"
    );
    headers.set("Cache-Control", "public, max-age=3600");

    if (download === "1") {
      headers.set(
        "Content-Disposition",
        `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`
      );
    }

    return new NextResponse(arrayBuffer, { status: 200, headers });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error: "Proxy error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}