"use client";

import { track } from "@/lib/analytics/track";
import type { PricingConfig } from "@/lib/billing/types";

export function VeoFastPage({ config }: { config: PricingConfig }) {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a] text-white">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <header className="text-center">
          <h1 className="text-3xl md:text-4xl font-semibold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
            Veo Fast — Fast, high-fidelity upgrades for your draft
          </h1>
          <p className="mt-3 text-base text-white/70">
            When Sora helps you explore, Veo Fast helps you refine. Better detail and motion while staying quick.
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
          <div className="text-lg font-semibold text-white mb-4">What Veo Fast is best for</div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { t: "Crisp product shots with stable motion", d: "Better motion consistency for product showcases and demos." },
              { t: "Cleaner textures and sharper edges", d: "Improved detail quality without sacrificing speed." },
              { t: "Faster iteration when quality matters", d: "Get sharper results while maintaining quick turnaround." },
            ].map((x) => (
              <div key={x.t} className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <div className="font-semibold text-white">{x.t}</div>
                <div className="mt-2 text-sm text-white/70">{x.d}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <div className="text-lg font-semibold text-white">How it fits the workflow</div>
          <div className="mt-3 grid gap-3 text-sm text-white/80 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="font-semibold text-white">Draft in Sora to lock the idea and composition</div>
              <p className="mt-2 text-white/70">Fast exploration and iteration</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="font-semibold text-white">Refine in Veo Fast to improve realism and clarity</div>
              <p className="mt-2 text-white/70">Without slowing down</p>
            </div>
          </div>
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

