// Browsers drop the lock when the tab is hidden, so it is re-requested each time the page becomes visible.
export function keepAwake(nav: Navigator | undefined = globalThis.navigator, doc: Document | undefined = globalThis.document): () => void {
  const wakeLock = nav?.wakeLock
  if (!wakeLock) return () => {}
  let released = false
  let sentinel: WakeLockSentinel | null = null

  const acquire = () => {
    wakeLock.request('screen').then(
      s => {
        if (released) s.release().catch(() => {})
        else sentinel = s
      },
      () => {}, // denied or unsupported → the session just runs without a lock
    )
  }
  const onVisibility = () => {
    if (!released && doc?.visibilityState === 'visible') acquire()
  }

  acquire()
  doc?.addEventListener('visibilitychange', onVisibility)
  return () => {
    released = true
    doc?.removeEventListener('visibilitychange', onVisibility)
    sentinel?.release().catch(() => {})
    sentinel = null
  }
}
