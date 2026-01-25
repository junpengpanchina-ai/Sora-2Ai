'use client'

// ============================================================
// Phase 2B: 生成状态组件
// 目标：预期管理 + 风险反转 = 建立信任
// ============================================================

type Stage = 'prepare' | 'generate' | 'finalize'

interface GenerationStatusProps {
  stage: Stage
  progress?: number
}

const STAGES: { key: Stage; label: string }[] = [
  { key: 'prepare', label: 'Preparing prompt' },
  { key: 'generate', label: 'Generating video frames' },
  { key: 'finalize', label: 'Finalizing output' },
]

export function GenerationStatus({ stage, progress = 0 }: GenerationStatusProps) {
  const stageIndex = STAGES.findIndex(s => s.key === stage)
  
  return (
    <div className="mx-auto max-w-lg">
      <div className="card p-6 animate-fade-up">
        <h2 className="text-lg font-semibold text-[var(--text)] mb-2">
          Generating your video
        </h2>

        <p className="text-sm text-[var(--muted)] mb-5">
          This usually takes under a minute.
        </p>

        {/* 三阶段进度 */}
        <ul className="space-y-3 mb-5">
          {STAGES.map((s, idx) => {
            const isCompleted = idx < stageIndex
            const isActive = idx === stageIndex
            
            return (
              <li 
                key={s.key}
                className={`flex items-center gap-3 text-sm transition-colors ${
                  isCompleted 
                    ? 'text-green-400' 
                    : isActive 
                      ? 'text-[var(--text)]' 
                      : 'text-[var(--muted)] opacity-50'
                }`}
              >
                {isCompleted ? (
                  <svg className="h-5 w-5 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : isActive ? (
                  <div className="h-5 w-5 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin shrink-0" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-current opacity-30 shrink-0" />
                )}
                <span className={isActive ? 'font-medium' : ''}>{s.label}</span>
              </li>
            )
          })}
        </ul>

        {/* 进度条 */}
        <div className="h-1.5 w-full rounded-full bg-[var(--surface)] overflow-hidden mb-2">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-blue-400 transition-all duration-500"
            style={{ width: `${Math.max(progress, 5)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-[var(--muted)] mb-5">
          <span>{progress}%</span>
          <span>~1 min</span>
        </div>

        {/* 风险反转 - 最重要的信任文案 */}
        <div className="text-xs text-[var(--muted)] border-t border-[var(--border)] pt-4">
          <div className="flex items-center gap-2 mb-1">
            <svg className="h-4 w-4 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>Credits are reserved during generation.</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span><strong className="text-[var(--text)]">Failed generations are refunded automatically.</strong></span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// 成功态组件
// ============================================================

interface GenerationSuccessProps {
  videoUrl: string
  onGenerateAnother: () => void
  onDownload: () => void
}

export function GenerationSuccess({ 
  videoUrl, 
  onGenerateAnother,
  onDownload 
}: GenerationSuccessProps) {
  return (
    <div className="mx-auto max-w-2xl animate-fade-up">
      {/* 成功提示 */}
      <div className="flex items-center justify-center gap-2 text-green-400 mb-6">
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="text-xl font-semibold">Your video is ready</h2>
      </div>

      {/* 视频播放器 */}
      <video
        src={videoUrl}
        controls
        autoPlay
        muted
        playsInline
        className="w-full rounded-xl border border-[var(--border)] mb-6"
      />

      {/* 主要操作 */}
      <div className="flex flex-wrap justify-center gap-3">
        <button 
          onClick={onDownload}
          className="btn btn-primary"
        >
          <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download
        </button>
        <button 
          onClick={onGenerateAnother}
          className="btn btn-secondary"
        >
          <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Generate another
        </button>
      </div>
    </div>
  )
}

// ============================================================
// 失败态组件
// ============================================================

interface GenerationErrorProps {
  error?: string
  onRetry: () => void
}

export function GenerationError({ error, onRetry }: GenerationErrorProps) {
  return (
    <div className="mx-auto max-w-lg animate-fade-up">
      <div className="card p-6">
        <div className="flex items-center gap-2 text-red-400 mb-4">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-lg font-semibold">Generation failed</h2>
        </div>

        <p className="text-sm text-[var(--muted)] mb-4">
          {error || 'Something went wrong while generating your video.'}
        </p>

        {/* 信任感 > 技术解释 */}
        <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3 mb-5">
          <p className="text-sm text-green-400 flex items-center gap-2">
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Don&apos;t worry — credits have been refunded automatically.</span>
          </p>
        </div>

        <button onClick={onRetry} className="btn btn-primary w-full">
          Try again
        </button>
      </div>
    </div>
  )
}
