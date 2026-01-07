import type { PricingConfig } from "@/lib/billing/types";

export function CreditUsageTable({ config }: { config: PricingConfig }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
      <div className="text-lg font-semibold text-white">How many credits does each render take?</div>
      <p className="mt-2 text-sm text-white/70">
        Bonus credits are spent first. Permanent credits never expire.
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-white/80">
            <tr className="border-b border-white/10">
              <th className="py-2 font-semibold">Model</th>
              <th className="py-2 font-semibold">Credits per render</th>
              <th className="py-2 font-semibold">Best for</th>
            </tr>
          </thead>
          <tbody className="text-white/80">
            <tr className="border-b border-white/5">
              <td className="py-3 font-medium">Sora</td>
              <td className="py-3">{config.soraCreditsPerRender}</td>
              <td className="py-3">Drafts, iterations, exploring styles</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="py-3 font-medium">Veo Flash</td>
              <td className="py-3">{config.veoFlashCreditsPerRender}</td>
              <td className="py-3">Quality upgrade without slowing down</td>
            </tr>
            <tr>
              <td className="py-3 font-medium">Veo Pro</td>
              <td className="py-3">{config.veoProCreditsPerRender}</td>
              <td className="py-3">Final export, highest realism and fidelity</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

