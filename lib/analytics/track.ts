type TrackProps = Record<string, unknown>;

export function track(event: string, props: TrackProps = {}) {
  // 1) Replace this with PostHog / GA / Segment as needed
  // posthog.capture(event, props)
  // gtag('event', event, props)
  // fetch('/api/track', { method:'POST', body: JSON.stringify({event, props}) })

  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.log("[track]", event, props);
  }
}

