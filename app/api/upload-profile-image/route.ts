import { NextRequest, NextResponse } from 'next/server'
// import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getStorage } from 'firebase-admin/storage'
import { getAuth } from 'firebase-admin/auth'

// Initialize Firebase Admin if not already initialized
// if (!getApps().length) {
//     initializeApp({
//         credential: cert({
//             projectId: process.env.FIREBASE_PROJECT_ID,
//             clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
//             privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
//         }),
//         storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
//     })
// }

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const token = formData.get('token') as string;

        if (!file || !token) {
            return NextResponse.json({ error: 'Missing file or token' }, { status: 400 })
        }

        // Verify the user token
        const auth = getAuth()
        const decodedToken = await auth.verifyIdToken(token)
        const userId = decodedToken.uid

        // Upload to Firebase Storage
        const storage = getStorage()
        const bucket = storage.bucket()

        const timestamp = Date.now()
        const fileExtension = file.name.split('.').pop()
        const fileName = `profile-images/${userId}/profile-${timestamp}.${fileExtension}`

        const buffer = Buffer.from(await file.arrayBuffer())
        const fileBuffer = bucket.file(fileName)

        await fileBuffer.save(buffer, {
            metadata: {
                contentType: file.type,
            },
        })

        // Make the file publicly accessible
        await fileBuffer.makePublic()

        // Get the public URL
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`

        return NextResponse.json({ url: publicUrl })
    } catch (error) {
        console.error('Upload error:', error)
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }
}
