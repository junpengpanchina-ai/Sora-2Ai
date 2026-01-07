import { VeoProPage as VeoProPageComponent } from "@/components/veo/VeoProPage";
import type { PricingConfig } from "@/lib/billing/types";

export default function VeoProPage() {
  const config: PricingConfig = {
    currency: "USD",
    soraCreditsPerRender: 10,
    veoFlashCreditsPerRender: 50,
    veoProCreditsPerRender: 250,
  };
  return <VeoProPageComponent config={config} />;
}
