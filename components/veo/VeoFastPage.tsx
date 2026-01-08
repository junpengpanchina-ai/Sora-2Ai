"use client";

import { track } from "@/lib/analytics/track";
import type { PricingConfig } from "@/lib/billing/types";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function VeoFastPage({ config }: { config: PricingConfig }) {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a] text-white">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <header className="text-center">
          <h1 className="text-3xl md:text-4xl font-semibold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
            Veo Fast
          </h1>
          <p className="mt-3 text-base text-white/70">
            A clean quality upgrade — still fast enough to keep your workflow moving.
          </p>

          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <button
              className="w-full rounded-xl bg-gradient-to-r from-[#1f75ff] to-[#3f8cff] px-5 py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity sm:w-auto"
              onClick={() => {
                track("veo_fast_primary_cta_click");
                window.location.href = "/video";
              }}
            >
              Generate with Veo Fast
            </button>

            <button
              className="w-full rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white hover:bg-white/5 transition-colors sm:w-auto"
              onClick={() => {
                track("veo_fast_secondary_cta_click");
                window.location.href = "/video";
              }}
            >
              Start with Sora Preview
            </button>
          </div>
        </header>

        <section className="mt-10">
          <div className="text-lg font-semibold text-white mb-4">Why Veo Fast</div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { t: "Better detail, still fast", d: "A reliable step up when you want a cleaner look without changing your pace." },
              { t: "Great for quick upgrades", d: "Perfect for the &quot;this is almost ready&quot; moment before the final cut." },
              { t: "Predictable credits", d: "50 credits per render — easy to plan and budget." },
            ].map((x) => (
              <div key={x.t} className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <div className="font-semibold text-white">{x.t}</div>
                <div className="mt-2 text-sm text-white/70">{x.d}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <div className="text-lg font-semibold text-white mb-4">Recommended workflow</div>
          <p className="text-sm text-white/80">
            Draft with <span className="font-semibold text-white">Sora Preview</span> → Upgrade with <span className="font-semibold text-white">Veo Fast</span> → Finalize with <span className="font-semibold text-white">Veo Pro</span> (when needed)
          </p>
        </section>

        <section className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <div className="text-lg font-semibold text-white mb-4">Transparency</div>
          <ul className="space-y-2 text-sm text-white/80">
            <li>• Credits are deducted per render</li>
            <li>• Unused permanent credits never expire</li>
            <li>• Bonus credits (if included) are time-limited and always used first</li>
          </ul>
        </section>

        <section className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <div className="text-lg font-semibold text-white mb-4">FAQ</div>
          <div className="space-y-4 text-sm text-white/80">
            <div>
              <div className="font-semibold text-white mb-1">Is Veo Fast &quot;better than Sora&quot;?</div>
              <p>They serve different moments. Sora is ideal for exploration and iteration. Veo Fast is for sharper results when you&apos;re close to final.</p>
            </div>
            <div>
              <div className="font-semibold text-white mb-1">Can I use Veo Fast on Starter Access?</div>
              <p>Starter includes limited daily access to keep the service reliable and fair.</p>
            </div>
          </div>
        </section>

        <section className="mt-10 text-center">
          <div className="text-lg font-semibold text-white mb-2">Ready to refine your drafts?</div>
          <button
            className="rounded-xl bg-gradient-to-r from-[#1f75ff] to-[#3f8cff] px-5 py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            onClick={() => {
              track("veo_fast_bottom_cta_click");
              window.location.href = "/video";
            }}
          >
            Generate with Veo Fast
          </button>
        </section>
      </div>
    </main>
  );
}

