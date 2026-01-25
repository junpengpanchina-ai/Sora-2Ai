'use client'

import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { Card, CardContent, CardHeader, CardTitle, Input, Button } from '@/components/ui'

import { LOCKDOWN_CORE_15x4 } from '@/app/admin/prompts/presets/lockdown_core_15x4'
import { BatchGenerateBodySchema, type BatchGenerateBodyForm, type BatchGenerateBody, parseLines, computeEst } from './schema'
import { presetToBatchBody } from './presetToBody'

type RunState =
  | { status: 'idle' }
  | { status: 'running' }
  | { status: 'done'; taskId: string }
  | { status: 'error'; message: string }

function getStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((v): v is string => typeof v === 'string').map((s) => s.trim()).filter(Boolean)
}

function makeDefaultValues(): BatchGenerateBodyForm {
  const v = presetToBatchBody(LOCKDOWN_CORE_15x4)
  // react-hook-form expects mutable arrays
  return {
    ...v,
    industries: [...v.industries],
    scenes: [...v.scenes],
    sceneIds: [...(v.sceneIds ?? [])],
    strategy: v.strategy ? { ...v.strategy } : undefined,
  }
}

export function PromptGeneratorForm() {
  const [runState, setRunState] = useState<RunState>({ status: 'idle' })

  const form = useForm<BatchGenerateBodyForm>({
    resolver: zodResolver(BatchGenerateBodySchema),
    defaultValues: makeDefaultValues(),
    mode: 'onChange',
  })

  const v = form.watch()
  const est = useMemo(() => {
    const parsed = BatchGenerateBodySchema.safeParse(v)
    if (parsed.success) return computeEst(parsed.data)
    const fallback: Pick<BatchGenerateBody, 'industries' | 'scenes' | 'perCellCount' | 'maxTotalPrompts'> = {
      industries: getStringArray((v as unknown as { industries?: unknown })?.industries),
      scenes: getStringArray((v as unknown as { scenes?: unknown })?.scenes),
      perCellCount: Number((v as unknown as { perCellCount?: unknown })?.perCellCount ?? 0) || 0,
      maxTotalPrompts: Number((v as unknown as { maxTotalPrompts?: unknown })?.maxTotalPrompts ?? 0) || 0,
    }
    return computeEst(fallback)
  }, [v])

  async function submitOneTask(input: BatchGenerateBody): Promise<string> {
    const res = await fetch('/api/admin/prompt-templates/batch-generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data?.success || !data?.taskId) {
      throw new Error(data?.error || `Request failed (${res.status})`)
    }
    return String(data.taskId)
  }

  async function onSubmit(valuesInput: BatchGenerateBodyForm) {
    setRunState({ status: 'running' })
    try {
      const values: BatchGenerateBody = BatchGenerateBodySchema.parse(valuesInput)
      const taskId = await submitOneTask(values)
      setRunState({ status: 'done', taskId })
    } catch (e) {
      setRunState({ status: 'error', message: e instanceof Error ? e.message : 'Run failed' })
    }
  }

  const canRun = form.formState.isValid && runState.status !== 'running'

  return (
    <Card>
      <CardHeader>
        <CardTitle>🧠 Prompt Asset Generator（Default Preset + Editable）</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" onClick={() => form.reset(makeDefaultValues())}>
            Use Default Preset
          </Button>
          <Button type="button" onClick={form.handleSubmit(onSubmit)} disabled={!canRun}>
            {runState.status === 'running' ? 'Running…' : 'Run Generation'}
          </Button>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white/50 p-3 text-sm dark:border-gray-700 dark:bg-gray-900/40">
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <div>
              <span className="font-semibold">Scenes:</span> {v.scenes?.length ?? 0}
            </div>
            <div>
              <span className="font-semibold">Industries:</span> {v.industries?.length ?? 0}
            </div>
            <div>
              <span className="font-semibold">Cells:</span> {est.cells}
            </div>
            <div>
              <span className="font-semibold">Per Cell:</span> {est.perCell}
            </div>
            <div>
              <span className="font-semibold">Estimated Total:</span> {est.estTotal} / {est.cap}
            </div>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <div className="text-xs text-gray-500 mb-1">ownerScope</div>
            <select
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              value={(v.ownerScope as string | undefined) ?? 'global'}
              onChange={(e) => form.setValue('ownerScope', e.target.value as 'global' | 'scene', { shouldValidate: true })}
            >
              <option value="global">global</option>
              <option value="scene">scene</option>
            </select>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">locale</div>
            <Input {...form.register('locale')} placeholder="en" />
            {form.formState.errors.locale?.message ? (
              <div className="mt-1 text-xs text-red-600">{String(form.formState.errors.locale.message)}</div>
            ) : null}
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">modelId</div>
            <Input {...form.register('modelId')} placeholder="sora" />
            {form.formState.errors.modelId?.message ? (
              <div className="mt-1 text-xs text-red-600">{String(form.formState.errors.modelId.message)}</div>
            ) : null}
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">role</div>
            <Input {...form.register('role')} placeholder="default" />
            {form.formState.errors.role?.message ? (
              <div className="mt-1 text-xs text-red-600">{String(form.formState.errors.role.message)}</div>
            ) : null}
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">perCellCount</div>
            <Input type="number" {...form.register('perCellCount', { valueAsNumber: true })} />
            {form.formState.errors.perCellCount?.message ? (
              <div className="mt-1 text-xs text-red-600">{String(form.formState.errors.perCellCount.message)}</div>
            ) : null}
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">maxTotalPrompts</div>
            <Input type="number" {...form.register('maxTotalPrompts', { valueAsNumber: true })} />
            {form.formState.errors.maxTotalPrompts?.message ? (
              <div className="mt-1 text-xs text-red-600">{String(form.formState.errors.maxTotalPrompts.message)}</div>
            ) : null}
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">maxRetriesPerCell</div>
            <Input type="number" {...form.register('maxRetriesPerCell', { valueAsNumber: true })} />
            {form.formState.errors.maxRetriesPerCell?.message ? (
              <div className="mt-1 text-xs text-red-600">{String(form.formState.errors.maxRetriesPerCell.message)}</div>
            ) : null}
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">presetId</div>
            <Input {...form.register('presetId')} placeholder="lockdown_core_15x4" />
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-700">
          <div className="font-semibold">Strategy (primary / secondary / fallback)</div>
          <div className="mt-2 grid gap-3 md:grid-cols-3">
            <div>
              <div className="text-xs text-gray-500 mb-1">primary</div>
              <Input {...form.register('strategy.primary')} placeholder="gemini-2.5-flash" />
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">secondary</div>
              <Input {...form.register('strategy.secondary')} placeholder="gemini-3-flash" />
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">fallback</div>
              <Input {...form.register('strategy.fallback')} placeholder="gemini-3-pro" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-700">
          <div className="font-semibold">Initial rollout knobs</div>
          <div className="mt-2 grid gap-3 md:grid-cols-4">
            <div>
              <div className="text-xs text-gray-500 mb-1">initialStatus</div>
              <select
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                value={(v.initialStatus as string | undefined) ?? ''}
                onChange={(e) => {
                  const next = e.target.value
                  form.setValue(
                    'initialStatus',
                    next === '' ? undefined : (next as 'draft' | 'active' | 'deprecated'),
                    { shouldValidate: true }
                  )
                }}
              >
                <option value="">(default)</option>
                <option value="draft">draft</option>
                <option value="active">active</option>
                <option value="deprecated">deprecated</option>
              </select>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">initialIsPublished</div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" {...form.register('initialIsPublished')} />
                Published
              </label>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">initialWeight</div>
              <Input type="number" {...form.register('initialWeight', { valueAsNumber: true })} />
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">initialRolloutPct</div>
              <Input type="number" {...form.register('initialRolloutPct', { valueAsNumber: true })} />
            </div>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <div className="text-xs text-gray-500 mb-1">Industries (one per line)</div>
            <textarea
              className="min-h-[220px] w-full rounded-lg border border-gray-300 bg-white p-3 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              value={(v.industries ?? []).join('\n')}
              onChange={(e) => form.setValue('industries', parseLines(e.target.value), { shouldValidate: true })}
            />
            {form.formState.errors.industries?.message ? (
              <div className="mt-1 text-xs text-red-600">{String(form.formState.errors.industries.message)}</div>
            ) : null}
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Scenes (one per line)</div>
            <textarea
              className="min-h-[220px] w-full rounded-lg border border-gray-300 bg-white p-3 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              value={(v.scenes ?? []).join('\n')}
              onChange={(e) => form.setValue('scenes', parseLines(e.target.value), { shouldValidate: true })}
            />
            {form.formState.errors.scenes?.message ? (
              <div className="mt-1 text-xs text-red-600">{String(form.formState.errors.scenes.message)}</div>
            ) : null}
          </div>
        </div>

        {runState.status === 'done' ? (
          <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-900 dark:border-green-900 dark:bg-green-950/30 dark:text-green-200">
            ✅ Started task: {runState.taskId}
          </div>
        ) : runState.status === 'error' ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
            ❌ {runState.message}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

