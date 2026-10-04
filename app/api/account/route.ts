import { v2 as cloudinary } from "cloudinary";
import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDatabase, getAdminFirestore } from "@/lib/firebase-admin";
import { authenticatedUser, errorResponse } from "@/lib/server/billing";
import { BillingError } from "@/lib/subscription-model";
export const runtime = "nodejs";
cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET });
const RECENT_LOGIN_SECONDS = 5 * 60;
// Cloudinary deletes at most 1000 assets per call and reports `partial` while more remain.
async function deleteByPrefix(prefix: string, resourceType: "raw" | "image") {
  for (let round = 0; round < 50; round++) {
    const result = await cloudinary.api.delete_resources_by_prefix(prefix, { resource_type: resourceType });
    if (!result.partial) return;
  }
  throw new Error("Too many files to delete in one request.");
}
// Self-serve account deletion. Data stores go first and the sign-in account last, so a failed
// attempt leaves the user able to sign in and retry. Payment references (paymentOwners) are kept
// for accounting and dispute handling, as stated in the Privacy Policy.
export async function DELETE(request: NextRequest) {
  try {
    const decoded = await authenticatedUser(request), uid = decoded.uid;
    if (Date.now() / 1000 - decoded.auth_time > RECENT_LOGIN_SECONDS) throw new BillingError("For your security, please sign out, sign in again, then retry deleting your account.", 403);
    await deleteByPrefix(`resumes/${uid}/`, "raw");
    await deleteByPrefix(`profile-images/${uid}-`, "image");
    const firestore = getAdminFirestore();
    await firestore.recursiveDelete(firestore.doc(`users/${uid}`));
    const database = getAdminDatabase();
    await Promise.all([database.ref(`billingAccounts/${uid}`).remove(), database.ref(`subscriptions/${uid}`).remove()]);
    await getAdminAuth().deleteUser(uid);
    return NextResponse.json({ success: true });
  } catch (error) { return errorResponse(error); }
}
