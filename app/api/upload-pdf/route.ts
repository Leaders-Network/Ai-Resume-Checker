import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase-admin";

// Configure Cloudinary from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        {
          resource_type: "raw",
          folder: "resumes",
          use_filename: true,
          unique_filename: true,
          filename_override: file.name,
          // "upload" type with no access_mode restriction = publicly accessible
          type: "upload",
        },
        (error, result) => {
          if (error) return reject(error);
          if (!result) return reject(new Error("No result returned from Cloudinary"));
          resolve(result);
        }
      );
      upload.end(buffer);
    });

    return NextResponse.json({
      url: result.secure_url,
      public_id: result.public_id,
      original_filename: result.original_filename || file.name,
    });
  } catch (error: unknown) {
    console.error("Upload error:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : typeof error === "object"
        ? JSON.stringify(error)
        : String(error);
    return NextResponse.json(
      { error: "Upload failed", details: errorMessage },
      { status: 500 }
    );
  }
}

// DELETE handler — removes a previously uploaded resume from Cloudinary + Firestore is handled client-side
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, publicId, resourceType = "raw" } = body || {};

    if (!token || !publicId) {
      return NextResponse.json(
        { error: "Missing token or publicId" },
        { status: 400 }
      );
    }

    // Verify Firebase ID token using Admin SDK
    let decodedToken;
    try {
      decodedToken = await getAdminAuth().verifyIdToken(token);
    } catch (authErr) {
      console.error("Token verification failed:", authErr);
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    if (!decodedToken?.uid) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Delete from Cloudinary
    const destroyResult = await new Promise<{ result: string }>(
      (resolve, reject) => {
        cloudinary.uploader.destroy(
          publicId,
          { resource_type: resourceType },
          (error, result) => {
            if (error) return reject(error);
            resolve(result as { result: string });
          }
        );
      }
    );

    // Cloudinary returns { result: 'ok' } on success
    if (
      destroyResult?.result === "ok" ||
      destroyResult?.result === "deleted" ||
      destroyResult?.result === "not found" // treat "not found" as success — already gone
    ) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: "Could not delete resource", details: destroyResult },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}