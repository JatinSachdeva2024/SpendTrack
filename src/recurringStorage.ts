import {
  deleteRecurringExpense as deleteRemote,
  fetchRecurringExpenses,
  insertRecurringExpense,
} from './data/recurringDb'
import type { RecurringExpense } from './types'

let cache: RecurringExpense[] = []
let ready = false

export function isRecurringReady(): boolean {
  return ready
}

export function getRecurringExpenses(): RecurringExpense[] {
  return cache
}

export async function initRecurringStorage(): Promise<void> {
  cache = await fetchRecurringExpenses()
  ready = true
}

export function resetRecurringStorage(): void {
  cache = []
  ready = false
}

export async function addRecurringExpense(item: RecurringExpense): Promise<RecurringExpense[]> {
  const saved = await insertRecurringExpense(item)
  cache = [...cache.filter((r) => r.id !== saved.id), saved]
  return cache
}

export async function removeRecurringExpense(id: string): Promise<RecurringExpense[]> {
  await deleteRemote(id)
  cache = cache.filter((r) => r.id !== id)
  return cache
}
