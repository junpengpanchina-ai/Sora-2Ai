// UpgradeNudge 文案配置（按触发点）
export type Trigger =
  | "after_2_sora_renders"
  | "export_click"
  | "quality_intent_click"
  | "high_iteration"
  | "prompt_high_intent"
  | "veo_locked_click"
  | "commercial_format"
  | "retry_same_prompt_3";

export type Copy = {
  title: string;
  body: string;
  primary: string;
  secondary: string;
};

export const UPGRADE_NUDGE_COPY: Record<Trigger, Copy> = {
  after_2_sora_renders: {
    title: "Ready for a cleaner final export?",
    body: "Sora is great for drafts. When you&apos;re happy with the idea, Veo Pro can improve motion realism and detail for the version you ship.",
    primary: "Upgrade this render with Veo Pro",
    secondary: "Keep drafting with Sora",
  },
  export_click: {
    title: "Exporting this one?",
    body: "For the final cut, Veo Pro typically delivers smoother motion and higher fidelity.",
    primary: "Upgrade to Veo Pro for final export",
    secondary: "Export as-is",
  },
  quality_intent_click: {
    title: "Want higher fidelity?",
    body: "Veo Pro is built for final delivery — sharper details and more realistic motion.",
    primary: "Try Veo Pro",
    secondary: "Not now",
  },
  high_iteration: {
    title: "Iterating fast — nice.",
    body: "When you land on the version you&apos;ll publish, Veo Pro helps make the final cut look cleaner.",
    primary: "Upgrade the final cut with Veo Pro",
    secondary: "Keep iterating",
  },
  prompt_high_intent: {
    title: "Making something commercial?",
    body: "For ads, product shots, and client work, Veo Pro is the best choice for final delivery quality.",
    primary: "Use Veo Pro for this render",
    secondary: "Continue with Sora",
  },
  veo_locked_click: {
    title: "Veo Pro is available on paid packs.",
    body: "Starter is designed for testing the workflow. Upgrade to unlock Veo Pro and higher limits.",
    primary: "See pricing",
    secondary: "Keep using Sora",
  },
  commercial_format: {
    title: "If this is the version you&apos;re publishing",
    body: "Veo Pro can deliver a cleaner final cut with smoother motion and higher fidelity.",
    primary: "Upgrade to Veo Pro",
    secondary: "Keep drafting",
  },
  retry_same_prompt_3: {
    title: "If this is the version you&apos;re publishing",
    body: "Veo Pro can deliver a cleaner final cut with smoother motion and higher fidelity.",
    primary: "Upgrade to Veo Pro",
    secondary: "Keep drafting",
  },
};

