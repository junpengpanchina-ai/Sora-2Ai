import { VeoFastPage } from "@/components/veo/VeoFastPage";
import type { PricingConfig } from "@/lib/billing/types";

export default function Page() {
  const config: PricingConfig = {
    currency: "USD",
    soraCreditsPerRender: 10,
    veoFlashCreditsPerRender: 50,
    veoProCreditsPerRender: 250,
  };
  return <VeoFastPage config={config} />;
}

