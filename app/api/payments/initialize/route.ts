import { NextResponse } from "next/server";
import { authenticatedUser, errorResponse, initializePayment, readJSON } from "@/lib/server/billing";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try { const user = await authenticatedUser(request); const body = await readJSON(request); return NextResponse.json(await initializePayment(user.uid, body?.planId, body?.billingInterval)); }
  catch (error) { return errorResponse(error); }
}
