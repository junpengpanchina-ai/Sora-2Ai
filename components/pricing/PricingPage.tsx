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
          <h1 className="text-3xl md:text-4xl font-semibold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
            Pricing that fits your workflow — draft fast, finish clean
          </h1>
          <p className="mt-3 text-base text-white/70">
            Use Sora for everyday iteration. Upgrade the final cut with Veo when quality matters.
          </p>
          <p className="mt-2 text-sm text-white/50">
            Credits never expire. Bonus credits may have an expiry (clearly labeled).
          </p>
        </header>

        <section className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <PlanCard
            planId="starter"
            title="Starter Access (7 days)"
            price="$4.90"
            badge="Try the workflow"
            bullets={[
              "120 bonus credits (expires in 7 days)",
              "Great for testing the workflow",
              "Daily limits keep the service reliable and fair",
              "Sora + Veo Fast available, Veo Pro locked",
            ]}
            ctaLabel="Start with Starter Access"
            onCta={(id) => onCheckout(id)}
            footnote="One-time purchase. New users also get 30 bonus credits (7 days)."
          />

          <PlanCard
            planId="creator"
            title="Creator Pack"
            price="$39"
            badge="Recommended"
            bullets={[
              "600 permanent credits",
              "+60 bonus credits (expires in 30 days)",
              "Access to Sora, Veo Fast, and Veo Pro",
              "Better limits + smoother queue",
              "Note: Veo Pro uses permanent credits only",
            ]}
            ctaLabel="Get Creator Pack"
            onCta={(id) => onCheckout(id)}
            variant="primary"
          />

          <PlanCard
            planId="studio"
            title="Studio Pack"
            price="$99"
            badge="Best value for Veo Pro"
            bullets={[
              "1,800 permanent credits",
              "+270 bonus credits (expires in 45 days)",
              "Built for final exports and client work",
              "Priority queue + higher concurrency",
              "Note: Veo Pro uses permanent credits only",
            ]}
            ctaLabel="Get Studio Pack"
            onCta={(id) => onCheckout(id)}
          />

          <PlanCard
            planId="pro"
            title="Pro Pack"
            price="$299"
            badge="For teams & heavy usage"
            bullets={[
              "6,000 permanent credits",
              "+1,200 bonus credits (expires in 60 days)",
              "Highest value per credit",
              "Best limits + fastest queue",
              "Note: Veo Pro uses permanent credits only",
            ]}
            ctaLabel="Get Pro Pack"
            onCta={(id) => onCheckout(id)}
          />
        </section>

        <section className="mt-10">
          <CreditUsageTable config={config} />
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

