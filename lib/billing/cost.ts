export type ModelId = "sora" | "veo_fast" | "veo_pro";

export function creditsCost(model: ModelId): number {
  if (model === "sora") return 10;
  if (model === "veo_fast") return 50;
  return 250;
}

