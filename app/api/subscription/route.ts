import { NextResponse } from "next/server";
import { authenticatedUser, errorResponse, readSubscription } from "@/lib/server/billing";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try { const user = await authenticatedUser(request); return NextResponse.json({ subscription: await readSubscription(user.uid) }, { headers: { "Cache-Control": "no-store" } }); }
  catch (error) { return errorResponse(error); }
}
