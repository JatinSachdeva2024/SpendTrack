import { getCurrency } from './currency'
import type { Spending } from './types'

export function formatMoney(amount: number): string {
  const currency = getCurrency()
  const noDecimals = currency === 'JPY' || currency === 'KRW'
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: noDecimals ? 0 : 0,
    minimumFractionDigits: noDecimals ? 0 : 0,
  }).format(amount)
}

export function formatDate(iso: string): string {
  const d = new Date(iso + 'T12:00:00')
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function monthKey(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}`
}

export function parseMonthKey(key: string): { year: number; month: number } {
  const [y, m] = key.split('-').map(Number)
  return { year: y, month: m - 1 }
}

export function currentMonthKey(): string {
  const now = new Date()
  return monthKey(now.getFullYear(), now.getMonth())
}

export function previousMonthKey(key: string): string {
  const { year, month } = parseMonthKey(key)
  const d = new Date(year, month - 1, 1)
  return monthKey(d.getFullYear(), d.getMonth())
}

export function monthLabel(key: string): string {
  const { year, month } = parseMonthKey(key)
  return new Date(year, month, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  })
}

export function filterByMonth(items: Spending[], key: string): Spending[] {
  return items.filter((s) => s.date.startsWith(key))
}

export function sumAmount(items: Spending[]): number {
  return items.reduce((acc, s) => acc + s.amount, 0)
}

/** Weeks 1–5 within a calendar month (days 1–7, 8–14, …). Resets each month. */
export function weeklyTotalsForMonth(
  items: Spending[],
  key: string,
): { week: number; total: number; label: string }[] {
  const { year, month } = parseMonthKey(key)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const weekCount = Math.ceil(daysInMonth / 7)

  const buckets = Array.from({ length: weekCount }, (_, i) => ({
    week: i + 1,
    total: 0,
    label: `W${i + 1}`,
  }))

  for (const s of items) {
    if (!s.date.startsWith(key)) continue
    const day = Number(s.date.slice(8, 10))
    const weekIndex = Math.min(Math.floor((day - 1) / 7), weekCount - 1)
    buckets[weekIndex].total += s.amount
  }

  return buckets
}

export function compareMonths(
  current: number,
  previous: number,
): { diff: number; percent: number | null; improved: boolean } {
  const diff = current - previous
  const percent =
    previous === 0 ? (current === 0 ? 0 : null) : Math.round((diff / previous) * 100)
  return { diff, percent, improved: diff <= 0 }
}

/** Grid slot for expense index: newest at (0,0), then right → down → right… */
export function widgetGridPosition(index: number, cols = 2): { row: number; col: number } {
  const row = Math.floor(index / cols)
  const col = index % cols
  return { row, col }
}

export function sortNewestFirst(items: Spending[]): Spending[] {
  return [...items].sort((a, b) => {
    const ta = a.createdAt ?? new Date(a.date + 'T12:00:00').getTime()
    const tb = b.createdAt ?? new Date(b.date + 'T12:00:00').getTime()
    return tb - ta || b.id.localeCompare(a.id)
  })
}

export function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Turn Supabase / fetch errors into readable text (never "[object Object]"). */
export function errorToMessage(err: unknown, fallback = 'Something went wrong.'): string {
  if (typeof err === 'string') return err
  if (err instanceof Error) return err.message || fallback
  if (typeof err === 'object' && err !== null) {
    const o = err as Record<string, unknown>
    if (typeof o.message === 'string' && o.message) return o.message
    if (o.message && typeof o.message === 'object') {
      return errorToMessage(o.message, fallback)
    }
    if (typeof o.error_description === 'string') return o.error_description
    if (typeof o.details === 'string') return o.details
    if (typeof o.hint === 'string') return o.hint
  }
  return fallback
}
