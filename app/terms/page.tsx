import type { Metadata } from "next";
import Link from "next/link";
import TermsContent from "@/components/TermsContent";
export const metadata: Metadata = { title: "Terms of Service | Leaders CV Checker" };
export default function TermsPage() {
  return <main className="min-h-screen bg-background text-foreground">
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Link href="/" className="text-sm text-muted-foreground underline underline-offset-2">← Back to home</Link>
      <h1 className="mb-6 mt-4 text-3xl font-bold">Terms of Service</h1>
      <TermsContent />
    </div>
  </main>;
}
