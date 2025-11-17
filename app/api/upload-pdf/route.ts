import { getAuth } from "firebase-admin/auth";
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import { NextRequest, NextResponse } from "next/server";

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
          upload_preset: "public_raw_upload",
          access_mode: "public"
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
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Upload failed", details: errorMessage },
      { status: 500 }
    );
  }
}

// DELETE handler to remove previously uploaded resumes (or other resources).
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json()
    const { token, publicId, resourceType = "raw" } = body || {}

    if (!token || !publicId) {
      return NextResponse.json({ error: "Missing token or publicId" }, { status: 400 })
    }

    // Verify Firebase token
    const decoded = await getAuth().verifyIdToken(token)
    if (!decoded?.uid) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const destroyResult = await new Promise<unknown>((resolve, reject) => {
      cloudinary.uploader.destroy(
        publicId,
        { resource_type: resourceType },
        (error, result) => {
          if (error) return reject(error)
          resolve(result)
        }
      )
    })

    // Cloudinary returns { result: 'ok' } or { result: 'not found' } etc.
    if ((destroyResult as { result: string })?.result === "ok" || (destroyResult as { result: string })?.result === "deleted") {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: "Could not delete resource", details: destroyResult }, { status: 400 })
    }
  } catch (error) {
    console.error("Delete error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}