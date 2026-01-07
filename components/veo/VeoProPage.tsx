"use client";

import { track } from "@/lib/analytics/track";
import type { PricingConfig } from "@/lib/billing/types";

export function VeoProPage({ config }: { config: PricingConfig }) {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a] text-white">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <header className="text-center">
          <h1 className="text-3xl md:text-4xl font-semibold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
            Veo Pro — Studio-grade video quality for your final export
          </h1>
          <p className="mt-3 text-base text-white/70">
            Draft fast with Sora. Upgrade the best take with Veo Pro for higher fidelity motion and realism.
          </p>

          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <button
              className="w-full rounded-xl bg-gradient-to-r from-[#1f75ff] to-[#3f8cff] px-5 py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity sm:w-auto"
              onClick={() => {
                track("veo_pro_primary_cta_click");
                window.location.href = "/pricing";
              }}
            >
              Get Veo Pro Credits
            </button>

            <button
              className="w-full rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white hover:bg-white/5 transition-colors sm:w-auto"
              onClick={() => {
                track("veo_pro_secondary_cta_click");
                window.location.href = "/pricing#starter";
              }}
            >
              Start with Sora (Starter Access)
            </button>
          </div>
        </header>

        <section className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            { t: "Cleaner motion", d: "More natural dynamics in complex scenes." },
            { t: "Higher detail", d: "Better fidelity and fewer artifacts." },
            { t: "Best for publishing", d: "Use when exporting for clients or marketing." },
          ].map((x) => (
            <div key={x.t} className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <div className="font-semibold text-white">{x.t}</div>
              <div className="mt-2 text-sm text-white/70">{x.d}</div>
            </div>
          ))}
        </section>

        <section className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <div className="text-lg font-semibold text-white">How it works</div>
          <div className="mt-3 grid gap-3 text-sm text-white/80 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="font-semibold text-white">Most creators use a 2-step workflow</div>
              <ol className="mt-2 list-decimal pl-5 text-white/70 space-y-1">
                <li>Draft with Sora for quick iterations</li>
                <li>Finalize with Veo Pro when ready to export</li>
              </ol>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="font-semibold text-white">Credit usage</div>
              <ul className="mt-2 space-y-1 text-white/70">
                <li>Sora: <b className="text-white">{config.soraCreditsPerRender}</b> credits / render</li>
                <li>Veo Flash: <b className="text-white">{config.veoFlashCreditsPerRender}</b> credits / render</li>
                <li>Veo Pro: <b className="text-white">{config.veoProCreditsPerRender}</b> credits / render</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className="text-lg font-semibold text-green-400">When Veo Pro is worth it</div>
            <ul className="mt-3 space-y-2 text-sm text-white/80">
              <li className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span>Final export (not just testing)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span>Smoother motion and stronger realism</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span>Marketing, product, or training videos</span>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className="text-lg font-semibold text-blue-400">When Sora is enough</div>
            <ul className="mt-3 space-y-2 text-sm text-white/80">
              <li className="flex items-start gap-2">
                <span className="text-blue-400">✓</span>
                <span>Exploring ideas and iterating prompts</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400">✓</span>
                <span>Testing different styles and variants</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400">✓</span>
                <span>Building a draft library before selecting the best take</span>
              </li>
            </ul>
          </div>
        </section>

        <section className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <div className="text-lg font-semibold text-white">Transparent and predictable</div>
          <ul className="mt-3 space-y-2 text-sm text-white/80">
            <li className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              <span>Permanent credits never expire</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              <span>Bonus credits have an expiration date (shown at purchase)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              <span>Credits are used automatically (bonus credits are spent first)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400">✓</span>
              <span>No subscription required — upgrade anytime</span>
            </li>
          </ul>
        </section>

        <section className="mt-10 text-center">
          <button
            className="rounded-xl bg-gradient-to-r from-[#1f75ff] to-[#3f8cff] px-5 py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            onClick={() => {
              track("veo_pro_bottom_cta_click");
              window.location.href = "/pricing";
            }}
          >
            Choose a Pack
          </button>
        </section>
      </div>
    </main>
  );
}

