import { NextRequest, NextResponse } from "next/server"
import { getAuth } from "firebase-admin/auth"
import { initializeApp, getApps, cert } from "firebase-admin/app"
import crypto from "crypto"

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  })
}

export async function POST(req: NextRequest) {
      console.log("DEBUG ENV: FIREBASE_PROJECT_ID =", process.env.FIREBASE_PROJECT_ID)
  console.log("DEBUG ENV: FIREBASE_CLIENT_EMAIL =", process.env.FIREBASE_CLIENT_EMAIL)
  console.log("DEBUG ENV: FIREBASE_PRIVATE_KEY exists =", !!process.env.FIREBASE_PRIVATE_KEY)
  console.log("DEBUG ENV: CLOUDINARY_CLOUD_NAME =", process.env.CLOUDINARY_CLOUD_NAME)

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

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64 = buffer.toString("base64")
    const dataUri = `data:${file.type};base64,${base64}`

    // Cloudinary config
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET

    if (!cloudName || !apiKey || !apiSecret) {
      console.error("Missing Cloudinary config", { cloudName, apiKey, hasSecret: !!apiSecret })
      return NextResponse.json({ error: "Cloudinary config missing" }, { status: 500 })
    }

    // Prepare Cloudinary signature
    const timestamp = Math.floor(Date.now() / 1000)
    const folder = "profile-images"
    const public_id = `${decoded.uid}-${Date.now()}`

    // Alphabetical ordering matters for Cloudinary signatures
    const paramsToSign = `folder=${folder}&public_id=${public_id}&timestamp=${timestamp}`
    const signature = crypto.createHash("sha1").update(paramsToSign + apiSecret).digest("hex")

    // Debug logs
    console.log("Cloudinary config:", { cloudName, apiKey, hasSecret: !!apiSecret })
    console.log("File details:", { type: file.type, size: buffer.length })
    console.log("Signature params:", paramsToSign)
    console.log("Generated signature:", signature)

    // Upload to Cloudinary
    const form = new FormData()
    form.append("file", dataUri)
    form.append("api_key", apiKey)
    form.append("timestamp", timestamp.toString())
    form.append("folder", folder)
    form.append("public_id", public_id)
    form.append("signature", signature)

    const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: form,
    })

    if (!uploadRes.ok) {
      const err = await uploadRes.text()
      console.error("Cloudinary error:", err)
      return NextResponse.json({ error: "Cloudinary upload failed", details: err }, { status: 500 })
    }

    const uploadData = await uploadRes.json()
    console.log("Cloudinary response:", uploadData)

    return NextResponse.json({ url: uploadData.secure_url })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
