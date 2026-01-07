"use client";

import { PlanCard } from "./PlanCard";
import { CreditUsageTable } from "./CreditUsageTable";
import { FAQAccordion, type FAQItem } from "./FAQAccordion";
import { track } from "@/lib/analytics/track";
import type { PricingConfig } from "@/lib/billing/types";

type Props = {
  config: PricingConfig;
  onCheckout: (planId: "starter" | "creator" | "studio" | "pro") => void;
};

const faq: FAQItem[] = [
  {
    q: "Do credits expire?",
    a: "Permanent credits never expire. Bonus credits are time-limited and display an expiration date at purchase.",
  },
  {
    q: "What are bonus credits?",
    a: "Bonus credits are temporary boosts designed to help you create more during a short window. They are spent first.",
  },
  {
    q: "Do I need a subscription?",
    a: "No. All packs are one-time purchases. Credits remain in your account and you can upgrade anytime.",
  },
  {
    q: "Can I use Veo Pro on Starter Access?",
    a: "Starter Access is designed for trying the workflow with daily limits. Veo Pro is available on paid packs with higher limits and priority.",
  },
  {
    q: "Is payment secure?",
    a: "Payments are processed by our payment provider. We do not store your full card details.",
  },
];

export function PricingPage({ config, onCheckout }: Props) {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a] text-white">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <header className="text-center">
          <h1 className="text-3xl md:text-4xl font-semibold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
            Pricing — Credits that fit your workflow
          </h1>
          <p className="mt-3 text-base text-white/70">
            Create at your own pace. Use Sora for drafts and iterations, then upgrade with Veo when you&apos;re ready to export.
          </p>
        </header>

        <section className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <PlanCard
            planId="starter"
            title="Starter Access (7 days)"
            price="$4.90"
            badge="Try the workflow"
            bullets={[
              "200 bonus credits (expires in 7 days)",
              "Sora drafts included",
              "Daily limits apply (to prevent automated abuse)",
              "Veo Pro not included in Starter",
            ]}
            ctaLabel="Start Starter Access"
            onCta={(id) => onCheckout(id)}
            footnote="Includes 30 free credits for new accounts (up to 3 Sora renders)."
          />

          <PlanCard
            planId="creator"
            title="Creator"
            price="$39"
            badge="Recommended"
            bullets={[
              "2,000 permanent credits",
              "+600 bonus credits (expires in 14 days)",
              "Access to Veo Flash",
              "Higher limits and priority than Starter",
            ]}
            ctaLabel="Get Creator"
            onCta={(id) => onCheckout(id)}
            variant="primary"
          />

          <PlanCard
            planId="studio"
            title="Studio"
            price="$99"
            badge="Best balance"
            bullets={[
              "6,000 permanent credits",
              "+1,500 bonus credits (expires in 30 days)",
              "Access to Veo Flash and Veo Pro",
              "Higher limits and priority",
            ]}
            ctaLabel="Get Studio"
            onCta={(id) => onCheckout(id)}
          />

          <PlanCard
            planId="pro"
            title="Pro"
            price="$299"
            badge="High volume"
            bullets={[
              "20,000 permanent credits",
              "+4,000 bonus credits (expires in 60 days)",
              "Best limits and priority",
              "Built for teams and agencies",
            ]}
            ctaLabel="Get Pro"
            onCta={(id) => onCheckout(id)}
          />
        </section>

        <section className="mt-10">
          <CreditUsageTable config={config} />
        </section>

        <section className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <div className="text-lg font-semibold text-white">A simple 2-step workflow</div>
          <div className="mt-3 grid gap-3 text-sm text-white/80 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="font-semibold text-white">1) Draft quickly with Sora</div>
              <p className="mt-1 text-white/70">Iterate fast, explore styles, and build a draft library.</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="font-semibold text-white">2) Upgrade with Veo Pro for final export</div>
              <p className="mt-1 text-white/70">When you&apos;re ready to publish, upgrade the best take.</p>
            </div>
          </div>

          <button
            className="mt-5 rounded-xl bg-gradient-to-r from-[#1f75ff] to-[#3f8cff] px-4 py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            onClick={() => {
              track("pricing_workflow_cta_click");
              window.location.href = "/veo-pro";
            }}
          >
            See Veo Pro
          </button>
        </section>

        <section className="mt-10">
          <FAQAccordion items={faq} />
        </section>
      </div>
    </main>
  );
}

