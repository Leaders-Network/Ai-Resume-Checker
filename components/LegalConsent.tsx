"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import toast from "react-hot-toast";
import { auth, db } from "@/config/firebase";
import { LEGAL_VERSION } from "@/lib/legal";
import TermsContent from "@/components/TermsContent";
import PrivacyPolicyContent from "@/components/PrivacyPolicyContent";
// Blocks the dashboard until the signed-in user has accepted the current Terms and Privacy Policy.
// The acceptance is recorded on the user's Firestore profile.
export default function LegalConsent() {
  const [user, loading] = useAuthState(auth);
  const [needed, setNeeded] = useState(false);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  useEffect(() => {
    if (loading || !user) return;
    let cancelled = false;
    getDoc(doc(db, "users", user.uid))
      .then(snap => { if (!cancelled) setNeeded(snap.data()?.legalVersion !== LEGAL_VERSION); })
      .catch(() => { if (!cancelled) setNeeded(true); });
    return () => { cancelled = true; };
  }, [user, loading]);
  if (!user || !needed) return null;
  const agree = async () => {
    setBusy(true);
    try {
      await setDoc(doc(db, "users", user.uid), { legalVersion: LEGAL_VERSION, legalAcceptedAt: new Date().toISOString() }, { merge: true });
      setNeeded(false);
    } catch { toast.error("Could not save your choice. Please try again."); }
    finally { setBusy(false); }
  };
  const reject = async () => {
    setBusy(true);
    try { await signOut(auth); } finally { router.replace("/"); }
  };
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-labelledby="legal-consent-title">
    <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-border bg-card text-card-foreground shadow-2xl">
      <div className="border-b border-border px-6 py-4">
        <h2 id="legal-consent-title" className="text-xl font-bold">Terms of Service &amp; Privacy Policy</h2>
        <p className="mt-1 text-sm text-muted-foreground">Please review and accept to continue. If you decline, you will be signed out.</p>
      </div>
      <div className="space-y-8 overflow-y-auto px-6 py-4">
        <section><h2 className="mb-3 text-lg font-bold">Terms of Service</h2><TermsContent /></section>
        <section><h2 className="mb-3 text-lg font-bold">Privacy Policy</h2><PrivacyPolicyContent /></section>
      </div>
      <div className="flex flex-col-reverse gap-3 border-t border-border px-6 py-4 sm:flex-row sm:justify-end">
        <button type="button" onClick={reject} disabled={busy} className="rounded-xl border border-border px-5 py-2 font-medium hover:bg-accent disabled:opacity-50">Reject</button>
        <button type="button" onClick={agree} disabled={busy} className="rounded-xl bg-primary px-5 py-2 font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">Agree</button>
      </div>
    </div>
  </div>;
}
