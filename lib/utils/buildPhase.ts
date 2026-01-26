export function isProdBuildPhase() {
  // Next.js sets NEXT_PHASE=phase-production-build during `next build`
  return process.env.NEXT_PHASE === 'phase-production-build'
}

export function shouldSkipStaticGeneration() {
  // CI/build can set this to avoid flaky build-time network calls (e.g., Supabase).
  return process.env.SKIP_STATIC_GENERATION === 'true'
}

