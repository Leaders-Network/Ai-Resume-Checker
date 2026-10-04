import type { Metadata } from "next";
import Link from "next/link";
import PrivacyPolicyContent from "@/components/PrivacyPolicyContent";
export const metadata: Metadata = { title: "Privacy Policy | Leaders CV Checker" };
export default function PrivacyPage() {
  return <main className="min-h-screen bg-background text-foreground">
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Link href="/" className="text-sm text-muted-foreground underline underline-offset-2">← Back to home</Link>
      <h1 className="mb-6 mt-4 text-3xl font-bold">Privacy Policy</h1>
      <PrivacyPolicyContent />
      <p className="mt-8 text-sm text-muted-foreground">See also our <Link href="/terms" className="underline underline-offset-2">Terms of Service</Link>.</p>
    </div>
  </main>;
}
