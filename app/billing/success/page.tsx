"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function BillingSuccessContent() {
  const sp = useSearchParams();
  const router = useRouter();
  const sessionId = sp.get("session_id");

  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  const [msg, setMsg] = useState<string>("Finalizing your credits...");

  useEffect(() => {
    if (!sessionId) {
      setState("error");
      setMsg("Missing session_id. Please contact support.");
      return;
    }

    (async () => {
      try {
        const res = await fetch("/api/billing/finalize", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });

        const data = await res.json().catch(() => ({}));
        
        if (res.ok && data?.ok) {
          setState("ok");
          setMsg("✅ Credits added successfully! Redirecting...");
          setTimeout(() => router.push("/video"), 1500);
        } else {
          setState("error");
          setMsg(data?.error || "Failed to finalize payment. Please contact support.");
        }
      } catch {
        setState("error");
        setMsg("Network error. Please refresh the page or contact support.");
      }
    })();
  }, [sessionId, router]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a] text-white flex items-center justify-center">
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Payment successful</h1>
        <p className="text-lg text-white/80 mb-8">{msg}</p>

        {state === "loading" && (
          <div className="flex items-center justify-center gap-2">
            <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-white"></div>
            <span className="text-sm text-white/60">Processing...</span>
          </div>
        )}

        {state === "error" && (
          <div className="space-y-4">
            <p className="text-sm text-white/60">
              Tip: Please make sure you are logged in on this device.
            </p>
            <div className="flex gap-3 justify-center">
              <Link
                href="/pricing"
                className="px-6 py-3 rounded-xl border border-white/20 hover:bg-white/5 transition-colors"
              >
                Back to Pricing
              </Link>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {state === "ok" && (
          <Link
            href="/video"
            className="inline-block px-8 py-3 rounded-xl bg-gradient-to-r from-[#1f75ff] to-[#3f8cff] hover:opacity-90 transition-opacity font-semibold"
          >
            Start Creating
          </Link>
        )}
      </div>
    </main>
  );
}

export default function BillingSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-gradient-to-b from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a] text-white flex items-center justify-center">
          <div className="max-w-md mx-auto px-4 py-16 text-center">
            <h1 className="text-3xl font-bold mb-4">Payment successful</h1>
            <p className="text-lg text-white/80 mb-8">Loading...</p>
            <div className="flex items-center justify-center gap-2">
              <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-white"></div>
              <span className="text-sm text-white/60">Processing...</span>
            </div>
          </div>
        </main>
      }
    >
      <BillingSuccessContent />
    </Suspense>
  );
}

