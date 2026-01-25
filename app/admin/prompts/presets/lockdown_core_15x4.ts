export const LOCKDOWN_CORE_15x4 = {
  preset_id: 'lockdown_core_15x4',
  display_name: 'LOCKDOWN · Core Prompt Expansion (15x4)',
  description: 'Safe prompt asset expansion during SEO lockdown phase. No index, gated by ROI.',
  enabled: true,

  scenes: ['ad_promo', 'product_explainer', 'social_short', 'landing_hero'],

  industries: [
    'ecommerce',
    'mobile_apps',
    'saas',
    'local_business',
    'education',
    'fitness',
    'real_estate',
    'travel',
    'gaming',
    'finance',
    'ai_tools',
    'social_creators',
    'restaurants',
    'beauty_skincare',
    'corporate_branding',
  ],

  generation_plan: {
    baseline_per_cell: 2,
    variant_per_cell: 2,
  },

  model_strategy: {
    baseline: 'gemini-2.5-flash',
    variant: 'gemini-3-flash',
    fallback: 'gemini-3-pro',
  },

  locale_strategy: {
    primary: 'en',
    secondary: [] as string[],
  },

  safety: {
    noindex: true,
    exclude_from_sitemap: true,
    allow_upgrade_to_scene: false,
  },

  budget_guard: {
    max_total_prompts: 300,
    max_daily_tokens: 800_000,
    hard_stop_on_budget_exceed: true,
  },

  initial_status: {
    status: 'active' as const,
    is_published: true,
    rollout_pct: 10,
    weight: 1,
  },
} as const

