import type { BatchGenerateBody } from './schema'
import { LOCKDOWN_CORE_15x4 } from '@/app/admin/prompts/presets/lockdown_core_15x4'

export function presetToBatchBody(preset = LOCKDOWN_CORE_15x4): BatchGenerateBody {
  const perCellCount = preset.generation_plan.baseline_per_cell + preset.generation_plan.variant_per_cell

  return {
    industries: [...preset.industries],
    scenes: [...preset.scenes],
    sceneIds: [],

    perCellCount,
    maxTotalPrompts: preset.budget_guard.max_total_prompts,
    maxRetriesPerCell: 2,

    ownerScope: 'global',
    modelId: 'sora',
    role: 'default',
    locale: preset.locale_strategy.primary,

    strategy: {
      primary: preset.model_strategy.baseline,
      secondary: preset.model_strategy.variant,
      fallback: preset.model_strategy.fallback,
    },

    presetId: preset.preset_id ?? null,
    initialStatus: preset.initial_status.status,
    initialIsPublished: preset.initial_status.is_published,
    initialWeight: preset.initial_status.weight,
    initialRolloutPct: preset.initial_status.rollout_pct,
  }
}

