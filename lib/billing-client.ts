import { auth } from "@/config/firebase";
export async function billingRequest(path: string, body?: object) {
  const user = auth.currentUser;
  if (!user) throw new Error("Please sign in.");
  const response = await fetch(path, { method: body ? "POST" : "GET", headers: { Authorization: `Bearer ${await user.getIdToken()}`, ...(body ? { "Content-Type": "application/json" } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}), cache: "no-store" });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "The service is unavailable. Please try again.");
  return result;
}
