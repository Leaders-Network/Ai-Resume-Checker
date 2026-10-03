import { randomUUID } from "node:crypto";
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase-admin";
import { authenticatedUser, changeAccount, errorResponse } from "@/lib/server/billing";
import { BillingError, reserveCredits, settleCredits } from "@/lib/subscription-model";
export const runtime = "nodejs";
cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET });
interface StoredFile { index: number; url: string; public_id: string; original_filename: string; }
async function upload(file: File, uid: string): Promise<UploadApiResponse> {
  const buffer = Buffer.from(await file.arrayBuffer());
  if (!buffer.subarray(0, 1024).includes(Buffer.from("%PDF-"))) throw new BillingError("Please upload a valid PDF.");
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ resource_type: "raw", folder: `resumes/${uid}`, use_filename: true, unique_filename: true, filename_override: file.name }, (error, result) => { if (error || !result) reject(error || new Error("Upload failed")); else resolve(result); });
    stream.end(buffer);
  });
}
export async function POST(request: NextRequest) {
  let uid: string | undefined, reservation: string | undefined;
  const stored: StoredFile[] = [];
  try {
    uid = (await authenticatedUser(request)).uid;
    const form = await request.formData(), entries = [...form.getAll("files"), ...form.getAll("file")];
    if (!entries.length || entries.length > 50 || entries.some(file => !(file instanceof File) || file.size < 1 || file.size > 10 * 1024 * 1024 || file.type !== "application/pdf")) throw new BillingError("Select between 1 and 50 PDF files, up to 10 MB each.");
    const files = entries as File[];
    if (files.reduce((sum, file) => sum + file.size, 0) > 50 * 1024 * 1024) throw new BillingError("Upload batches must be 50 MB or smaller.");
    reservation = randomUUID();
    await changeAccount(uid, (account, now) => reserveCredits(account, reservation!, files.length, now));
    const failures: { index: number; error: string }[] = [];
    // Bound storage concurrency on large batches.
    for (let offset = 0; offset < files.length; offset += 5) {
      await Promise.all(files.slice(offset, offset + 5).map(async (file, localIndex) => {
        const index = offset + localIndex;
        try { const result = await upload(file, uid!); stored.push({ index, url: result.secure_url, public_id: result.public_id, original_filename: file.name }); }
        catch { failures.push({ index, error: "This PDF could not be uploaded. No credit was used." }); }
      }));
    }
    const account = await changeAccount(uid, (account, now) => settleCredits(account, reservation!, stored.length, now));
    reservation = undefined;
    const ordered = stored.sort((a, b) => a.index - b.index);
    return NextResponse.json({ files: ordered, failures, subscription: account.subscription, ...(files.length === 1 && ordered.length ? ordered[0] : {}) });
  } catch (error) {
    // A failed settlement must not leave uncharged files in storage.
    await Promise.allSettled(stored.map(file => cloudinary.uploader.destroy(file.public_id, { resource_type: "raw" })));
    if (uid && reservation) await changeAccount(uid, (account, now) => settleCredits(account, reservation!, 0, now)).catch(() => undefined);
    return errorResponse(error);
  }
}
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    if (typeof body.token !== "string" || typeof body.publicId !== "string") throw new BillingError("Missing token or public ID.");
    let uid: string;
    try { uid = (await getAdminAuth().verifyIdToken(body.token)).uid; } catch { throw new BillingError("Please sign in.", 401); }
    const ownedPrefix = `resumes/${uid}/`;
    // Client-authored history is not proof of ownership of a storage asset.
    if (!body.publicId.startsWith(ownedPrefix)) throw new BillingError("This legacy CV needs an administrator to remove its stored file.", 404);
    const result = await cloudinary.uploader.destroy(body.publicId, { resource_type: "raw" });
    if (!["ok", "deleted", "not found"].includes(result.result)) throw new BillingError("Could not delete this CV.", 502);
    return NextResponse.json({ success: true });
  } catch (error) { return errorResponse(error); }
}
