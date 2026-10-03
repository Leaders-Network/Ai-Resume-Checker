import { NextResponse } from "next/server";
import { authenticatedUser, errorResponse, readJSON, verifyPayment } from "@/lib/server/billing";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try { const user = await authenticatedUser(request); const body = await readJSON(request); return NextResponse.json({ subscription: await verifyPayment(body?.reference, user.uid) }); }
  catch (error) { return errorResponse(error); }
}
