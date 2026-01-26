import { z } from 'zod'

// Strictly align to POST /api/admin/prompt-templates/batch-generate body
const SlugLine = z
  .string()
  .trim()
  .min(1, 'Required')
  .max(120, 'Too long')
  .regex(/^[a-z0-9_-]+$/, 'Use a-z 0-9 _ - only')

const UUIDish = z.string().min(8).max(80)

export const BatchGenerateBodySchema = z
  .object({
    industries: z.array(SlugLine).min(1).max(200),

    // Exactly one of scenes[] (slug) or sceneIds[] (UUID) should be used
    scenes: z.array(SlugLine).default([]),
    sceneIds: z.array(UUIDish).default([]),

    perCellCount: z.number().int().min(1).max(20).default(4),
    maxTotalPrompts: z.number().int().min(1).max(5000).default(300),
    maxRetriesPerCell: z.number().int().min(1).max(10).default(2),

    ownerScope: z.enum(['scene', 'global']).default('global'),
    modelId: z.string().min(1), // prompt_templates.model_id (e.g. sora/veo_fast/veo_pro/gemini)
    role: z.string().min(1).max(80),
    locale: z.string().min(2).max(12).default('en'),

    strategy: z
      .object({
        primary: z.string().min(1),
        secondary: z.string().min(1),
        fallback: z.string().min(1),
      })
      .optional(),

    presetId: z.string().nullable().optional(),
    initialStatus: z.enum(['draft', 'active', 'deprecated']).optional(),
    initialIsPublished: z.boolean().optional(),
    initialWeight: z.number().int().min(0).max(1000).optional(),
    initialRolloutPct: z.number().int().min(0).max(100).optional(),
  })
  .superRefine((v, ctx) => {
    const hasSceneIds = v.sceneIds.length > 0
    const hasScenes = v.scenes.length > 0
    if (hasSceneIds && hasScenes) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['sceneIds'],
        message: 'Use either sceneIds[] (UUID) OR scenes[] (slug), not both.',
      })
    }
    if (!hasSceneIds && !hasScenes) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['sceneIds'],
        message: 'Provide either sceneIds[] (UUID) or scenes[] (slug), at least 1.',
      })
    }

    const sceneCount = hasSceneIds ? v.sceneIds.length : v.scenes.length
    const cells = v.industries.length * sceneCount
    const estTotal = cells * (v.perCellCount ?? 4)
    const cap = v.maxTotalPrompts ?? 300

    if (estTotal > cap) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['maxTotalPrompts'],
        message: `Estimated total prompts ${estTotal} > cap ${cap}. Reduce industries/scenes or perCellCount.`,
      })
    }

    if (v.ownerScope === 'scene' && sceneCount <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['ownerScope'],
        message: 'ownerScope=scene requires a scene selection (sceneIds[] or scenes[]).',
      })
    }
  })

export type BatchGenerateBodyForm = z.input<typeof BatchGenerateBodySchema>
export type BatchGenerateBody = z.output<typeof BatchGenerateBodySchema>

export function parseLines(text: string) {
  return text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
}

export function computeEst(
  v: Pick<BatchGenerateBody, 'industries' | 'scenes' | 'sceneIds' | 'perCellCount' | 'maxTotalPrompts'>
) {
  const sceneCount = v.sceneIds.length > 0 ? v.sceneIds.length : v.scenes.length
  const perCell = v.perCellCount ?? 4
  const cells = v.industries.length * sceneCount
  const estTotal = cells * perCell
  return { sceneCount, perCell, cells, estTotal, cap: v.maxTotalPrompts ?? 300 }
}

