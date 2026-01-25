"use client";

import { PlanCard } from "./PlanCard";
import { CreditUsageTable } from "./CreditUsageTable";
import { FAQAccordion, type FAQItem } from "./FAQAccordion";
import type { PricingConfig } from "@/lib/billing/types";

type Props = {
  config: PricingConfig;
  onCheckout: (planId: "starter" | "creator" | "studio" | "pro") => void;
};

const faq: FAQItem[] = [
  {
    q: "Do credits expire?",
    a: "Purchased credits never expire. Bonus credits (from Starter or promotions) may have an expiry, and we always show the expiry date.",
  },
  {
    q: "What are bonus credits?",
    a: "Bonus credits are temporary credits that help you test the workflow. They&apos;re limited-time by design to keep pricing fair.",
  },
  {
    q: "Can I use Veo Pro on Starter?",
    a: "Starter is for testing the workflow with fair-use limits. Veo Pro is available on paid packs.",
  },
  {
    q: "Can I use bonus credits for Veo Pro?",
    a: "No. Veo Pro uses permanent credits only. Bonus credits are for Sora Preview and Veo Fast. This helps us maintain service quality and cashflow.",
  },
  {
    q: "What happens if a render fails?",
    a: "Failed renders are credited back automatically.",
  },
  {
    q: "Which model should I use?",
    a: "Use Sora for drafts and iteration. Use Veo Fast for quick quality upgrades. Use Veo Pro for the final export.",
  },
  {
    q: "Is there a daily limit?",
    a: "Starter includes daily limits to keep the service reliable for everyone. Paid packs have higher limits and priority.",
  },
];

export function PricingPage({ config, onCheckout }: Props) {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a] text-white">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <header className="text-center">
          {/* Phase 2C: 简化开场 - 强调简单、无订阅 */}
          <h1 className="text-3xl md:text-4xl font-semibold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
            Simple prepaid credits.
          </h1>
          <p className="mt-2 text-xl text-white/90">
            Pay once. Use anytime.
          </p>
          <p className="mt-4 text-base text-white/60">
            Most videos cost 10 credits. No subscriptions. No lock-in.
          </p>
        </header>

        <section className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <PlanCard
            planId="starter"
            title="Starter"
            price="$4.90"
            videoEstimate="~12 videos"
            badge="Try the workflow"
            bullets={[
              "120 bonus credits (7 days)",
              "Test with Sora + Veo Fast",
              "Daily limits keep service fair",
            ]}
            ctaLabel="Start with Starter"
            onCta={(id) => onCheckout(id)}
            footnote="Most videos cost 10 credits."
          />

          <PlanCard
            planId="creator"
            title="Creator"
            price="$39"
            videoEstimate="~60 videos"
            badge="Recommended"
            bullets={[
              "600 permanent credits",
              "+60 bonus (30 days)",
              "Unlock Veo Pro",
              "Better limits + queue",
            ]}
            ctaLabel="Get Creator Pack"
            onCta={(id) => onCheckout(id)}
            variant="primary"
            footnote="Most videos cost 10 credits."
          />

          <PlanCard
            planId="studio"
            title="Studio"
            price="$99"
            videoEstimate="~180 videos"
            badge="Best for Veo Pro"
            bullets={[
              "1,800 permanent credits",
              "+270 bonus (45 days)",
              "Priority queue",
              "For final exports",
            ]}
            ctaLabel="Get Studio Pack"
            onCta={(id) => onCheckout(id)}
            footnote="Most videos cost 10 credits."
          />

          <PlanCard
            planId="pro"
            title="Pro"
            price="$299"
            videoEstimate="~600 videos"
            badge="Teams & heavy usage"
            bullets={[
              "6,000 permanent credits",
              "+1,200 bonus (60 days)",
              "Best value per credit",
              "Fastest queue",
            ]}
            ctaLabel="Get Pro Pack"
            onCta={(id) => onCheckout(id)}
            footnote="Most videos cost 10 credits."
          />
        </section>

        <section className="mt-10">
          <CreditUsageTable config={config} />
        </section>

        {/* Phase 2C: 风险反转文案 - 降低付费摩擦 */}
        <section className="mt-10 rounded-2xl border border-green-500/20 bg-green-500/5 p-6 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 justify-center items-center text-center">
            <div className="flex items-center gap-2 text-green-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm font-medium">Unused credits never expire</span>
            </div>
            <div className="flex items-center gap-2 text-green-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm font-medium">Failed generations refunded automatically</span>
            </div>
          </div>
        </section>

        <section className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <div className="text-lg font-semibold text-white">A workflow you can scale</div>
          <div className="mt-3 grid gap-3 text-sm text-white/80 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="font-semibold text-white">Step 1: Draft with Sora</div>
              <p className="mt-1 text-white/70">Iterate fast and explore ideas.</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="font-semibold text-white">Step 2: Finalize with Veo Pro</div>
              <p className="mt-1 text-white/70">Upgrade the version you ship.</p>
            </div>
          </div>
          <p className="mt-3 text-sm text-white/60">
            You don&apos;t need Veo Pro for every render — only for the final cut.
          </p>
        </section>

        <section className="mt-10">
          <FAQAccordion items={faq} />
        </section>
      </div>
    </main>
  );
}

