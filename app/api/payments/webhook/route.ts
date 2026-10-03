import { NextResponse } from "next/server";
import { errorResponse, validWebhookSignature, verifyPayment } from "@/lib/server/billing";
export const runtime = "nodejs";
export async function POST(request: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return NextResponse.json({ error: "Webhook not configured." }, { status: 503 });
  const body = await request.text();
  if (!validWebhookSignature(body, request.headers.get("x-paystack-signature"), secret)) return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  try {
    const event = JSON.parse(body);
    // Ignore payments for other products sharing this Paystack account.
    if (event.event === "charge.success" && typeof event.data?.reference === "string" && event.data.reference.startsWith("lcv_")) await verifyPayment(event.data.reference);
    return NextResponse.json({ received: true });
  } catch (error) { return errorResponse(error); }
}
