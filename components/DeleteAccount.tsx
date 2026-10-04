"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import toast from "react-hot-toast";
import { Trash2 } from "lucide-react";
import { auth } from "@/config/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
const CONFIRM_WORD = "DELETE";
export default function DeleteAccount() {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const remove = async () => {
    const user = auth.currentUser;
    if (!user) return;
    setBusy(true);
    try {
      const response = await fetch("/api/account", { method: "DELETE", headers: { Authorization: `Bearer ${await user.getIdToken()}` } });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Could not delete your account. Please try again.");
      toast.success("Your account has been deleted.");
      await signOut(auth).catch(() => undefined);
      router.replace("/");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete your account.");
      setBusy(false);
    }
  };
  return <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-5">
    <h3 className="text-lg font-semibold text-foreground">Delete account</h3>
    <p className="mt-1 text-sm text-muted-foreground">Permanently deletes your sign-in account, profile, upload history, uploaded CVs, profile photo, plan and remaining credits. This cannot be undone.</p>
    {!open ? <Button type="button" variant="outline" className="mt-4 border-red-500/50 text-red-500 hover:bg-red-500/10" onClick={() => setOpen(true)}><Trash2 className="mr-2 h-4 w-4" />Delete my account</Button> : <div className="mt-4 space-y-3">
      <label htmlFor="delete-confirm" className="block text-sm font-medium text-foreground">Type {CONFIRM_WORD} to confirm</label>
      <Input id="delete-confirm" value={typed} onChange={e => setTyped(e.target.value)} autoComplete="off" disabled={busy} className="max-w-xs" />
      <div className="flex gap-3">
        <Button type="button" disabled={busy || typed !== CONFIRM_WORD} onClick={remove} className="bg-red-600 text-white hover:bg-red-700">{busy ? "Deleting…" : "Permanently delete"}</Button>
        <Button type="button" variant="outline" disabled={busy} onClick={() => { setOpen(false); setTyped(""); }}>Cancel</Button>
      </div>
    </div>}
  </div>;
}
