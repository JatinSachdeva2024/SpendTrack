import { getRecurringExpenses } from './recurringStorage'
import type { RecurringExpense, Spending } from './types'
import { currentMonthKey, monthLabel } from './utils'

const DISMISS_PREFIX = 'spendtrack-recurring-dismissed-'
const NOTIFIED_PREFIX = 'spendtrack-recurring-notified-'

export function currentMonthFirstDay(): string {
  const key = currentMonthKey()
  return `${key}-01`
}

/** Recurring templates not yet logged this month */
export function getPendingRecurring(
  spendings: Spending[],
  recurring = getRecurringExpenses(),
): RecurringExpense[] {
  const month = currentMonthKey()
  const loggedIds = new Set(
    spendings
      .filter((s) => s.date.startsWith(month) && s.recurringId)
      .map((s) => s.recurringId),
  )
  return recurring.filter((r) => !loggedIds.has(r.id))
}

export function isRecurringReminderWindow(): boolean {
  const day = new Date().getDate()
  return day >= 1 && day <= 3
}

export function isRecurringReminderDismissed(): boolean {
  try {
    return localStorage.getItem(`${DISMISS_PREFIX}${currentMonthKey()}`) === '1'
  } catch {
    return false
  }
}

export function dismissRecurringReminder(): void {
  try {
    localStorage.setItem(`${DISMISS_PREFIX}${currentMonthKey()}`, '1')
  } catch {
    /* ignore */
  }
}

export function shouldShowRecurringBanner(spendings: Spending[]): boolean {
  if (!isRecurringReminderWindow()) return false
  if (isRecurringReminderDismissed()) return false
  return getPendingRecurring(spendings).length > 0
}

export function wasNotifiedThisMonth(): boolean {
  try {
    return localStorage.getItem(`${NOTIFIED_PREFIX}${currentMonthKey()}`) === '1'
  } catch {
    return false
  }
}

export function markNotifiedThisMonth(): void {
  try {
    localStorage.setItem(`${NOTIFIED_PREFIX}${currentMonthKey()}`, '1')
  } catch {
    /* ignore */
  }
}

export async function requestRecurringNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export function showRecurringNotification(pendingCount: number): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  if (wasNotifiedThisMonth()) return
  if (pendingCount === 0) return

  const label = monthLabel(currentMonthKey())
  const body =
    pendingCount === 1
      ? `Add 1 recurring expense for ${label}.`
      : `Add ${pendingCount} recurring expenses for ${label}.`

  try {
    new Notification('SpendTrack — monthly recurring', {
      body,
      icon: '/favicon.svg',
      tag: `spendtrack-recurring-${currentMonthKey()}`,
    })
    markNotifiedThisMonth()
  } catch {
    /* ignore */
  }
}

export function runRecurringReminderCheck(spendings: Spending[]): void {
  if (!isRecurringReminderWindow()) return
  const pending = getPendingRecurring(spendings)
  if (pending.length === 0) return
  if (Notification.permission === 'granted') {
    showRecurringNotification(pending.length)
  }
}
