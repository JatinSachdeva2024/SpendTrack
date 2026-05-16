/** Production URL for auth email links (set VITE_APP_URL on Vercel). */
export function getSiteUrl(): string {
  const fromEnv = import.meta.env.VITE_APP_URL
  if (typeof fromEnv === 'string' && fromEnv.trim()) {
    return fromEnv.trim().replace(/\/$/, '')
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin
  }
  return ''
}

export function getAuthRedirectUrl(): string {
  const base = getSiteUrl()
  return base ? `${base}/` : ''
}
