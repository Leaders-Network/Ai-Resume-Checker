import { v2 as cloudinary } from "cloudinary";
import { NextRequest, NextResponse } from "next/server";

// Configure Cloudinary from environment variables
cloudinary.config({
  cloud_name: "diydxws5g",
  api_key: "649557923563211",
  api_secret: "vUCg0PYMiSrl2RaBnjsxzdis9rc",
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

    const result = await new Promise<any>((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        {
          resource_type: "raw",
          folder: "resumes",
          use_filename: true,
          unique_filename: true,
          filename_override: file.name,
          access_mode: "public",
        },
        (error, result) => {
          if (error) return reject(error);
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
  } catch (error: any) {
    return NextResponse.json(
      { error: "Upload failed", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}