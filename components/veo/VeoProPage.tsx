"use client";

import { track } from "@/lib/analytics/track";
import type { PricingConfig } from "@/lib/billing/types";

export function VeoProPage({ config }: { config: PricingConfig }) {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a] text-white">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <header className="text-center">
          <h1 className="text-3xl md:text-4xl font-semibold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
            Veo Pro — Studio-grade final renders
          </h1>
          <p className="mt-3 text-base text-white/70">
            For production-ready motion, realism, and the cleanest final export. Use it when the result is meant to be published.
          </p>

          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <button
              className="w-full rounded-xl bg-gradient-to-r from-[#1f75ff] to-[#3f8cff] px-5 py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity sm:w-auto"
              onClick={() => {
                track("veo_pro_primary_cta_click");
                window.location.href = "/video";
              }}
            >
              Render this as a Final Cut (Veo Pro)
            </button>

            <button
              className="w-full rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white hover:bg-white/5 transition-colors sm:w-auto"
              onClick={() => {
                track("veo_pro_secondary_cta_click");
                window.location.href = "/pricing";
              }}
            >
              Compare models
            </button>
          </div>
        </header>

        <section className="mt-10">
          <div className="text-lg font-semibold text-white mb-4">What you get</div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { t: "More realistic motion", d: "For people, objects, and camera movement in the final cut." },
              { t: "Higher fidelity detail", d: "In textures, edges, and lighting for production-ready output." },
              { t: "Cleaner final output", d: "For marketing, demos, and client delivery." },
            ].map((x) => (
              <div key={x.t} className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <div className="font-semibold text-white">{x.t}</div>
                <div className="mt-2 text-sm text-white/70">{x.d}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <div className="text-lg font-semibold text-white">How it works</div>
          <div className="mt-3 grid gap-3 text-sm text-white/80 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="font-semibold text-white">Step 1: Create drafts in Sora</div>
              <p className="mt-2 text-white/70">Fast iteration</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="font-semibold text-white">Step 2: Upgrade the final cut to Veo Pro</div>
              <p className="mt-2 text-white/70">Ship-ready</p>
            </div>
          </div>
        </section>

        <section className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <div className="text-lg font-semibold text-white mb-4">When to use each model</div>
          <div className="grid gap-3 text-sm text-white/80">
            <div><span className="font-semibold text-white">Sora (Preview):</span> early ideas, fast drafts, lots of iterations</div>
            <div><span className="font-semibold text-white">Veo Fast:</span> sharper upgrades while staying quick</div>
            <div><span className="font-semibold text-white">Veo Pro (Final Cut):</span> the version you deliver to an audience</div>
          </div>
        </section>

        <section className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <div className="text-lg font-semibold text-white">Workflow</div>
          <div className="mt-3 grid gap-3 text-sm text-white/80 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="font-semibold text-white">Step 1 — Draft</div>
              <p className="mt-2 text-white/70">Generate variations in Sora to pick the best direction</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="font-semibold text-white">Step 2 — Finalize</div>
              <p className="mt-2 text-white/70">Render with Veo Pro for your final export</p>
            </div>
          </div>
        </section>

        <section className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <div className="text-lg font-semibold text-white mb-4">Trust / transparency</div>
          <ul className="space-y-2 text-sm text-white/80">
            <li>• Predictable credits per render</li>
            <li>• Permanent credits never expire</li>
            <li>• Bonus credits (if included) are time-limited and always used first</li>
          </ul>
        </section>

        <section className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <div className="text-lg font-semibold text-white mb-4">FAQ (避坑版)</div>
          <div className="space-y-4 text-sm text-white/80">
            <div>
              <div className="font-semibold text-white mb-1">Do I need Veo Pro for every video?</div>
              <p>No. Most workflows start with Sora for drafts. Veo Pro is designed for final delivery.</p>
            </div>
            <div>
              <div className="font-semibold text-white mb-1">Can I access Veo Pro on Starter Access?</div>
              <p>Veo Pro is available on paid packs with higher limits and priority.</p>
            </div>
            <div>
              <div className="font-semibold text-white mb-1">Why are there usage limits on Starter?</div>
              <p>Starter includes daily limits to keep the service reliable and fair for everyone.</p>
            </div>
          </div>
        </section>

        <section className="mt-10 text-center">
          <div className="text-lg font-semibold text-white mb-2">Ready to render your final cut?</div>
          <button
            className="rounded-xl bg-gradient-to-r from-[#1f75ff] to-[#3f8cff] px-5 py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            onClick={() => {
              track("veo_pro_bottom_cta_click");
              window.location.href = "/video";
            }}
          >
            Render this as a Final Cut (Veo Pro)
          </button>
        </section>
      </div>
    </main>
  );
}

