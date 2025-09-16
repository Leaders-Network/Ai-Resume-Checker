import { NextRequest, NextResponse } from "next/server"
import { getAuth } from "firebase-admin/auth"
import { initializeApp, getApps, cert } from "firebase-admin/app"
import { v2 as cloudinary } from "cloudinary"

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID as string,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL as string,
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
    }),
  })
}

// Configure Cloudinary from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(req: NextRequest) {

  try {
    const formData = await req.formData()
    const file = formData.get("file") as File
    const token = formData.get("token") as string
    if (!file || !token) {
      return NextResponse.json({ error: "Missing file or token" }, { status: 400 })
    }

    // Verify Firebase token
    const decoded = await getAuth().verifyIdToken(token)
    if (!decoded?.uid) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload via Cloudinary SDK with public access
    const uploadResult = await new Promise<any>((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        {
          resource_type: "image",
          folder: "profile-images",
          use_filename: true,
          unique_filename: true,
          filename_override: `${decoded.uid}-${Date.now()}`,
          access_mode: "public",
          overwrite: true,
        },
        (error, result) => {
          if (error) return reject(error)
          resolve(result)
        }
      )
      upload.end(buffer)
    })

    return NextResponse.json({ url: uploadResult.secure_url })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
