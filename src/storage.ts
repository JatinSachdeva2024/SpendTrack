import { deleteSpending as deleteRemote, fetchSpendings, insertSpending } from './data/spendingsDb'
import type { Spending } from './types'
import { errorToMessage } from './utils'

const LOCAL_KEY = 'spendtrack-spendings'

let cache: Spending[] = []
let ready = false

function loadLocal(): Spending[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Spending[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function clearLocal(): void {
  localStorage.removeItem(LOCAL_KEY)
}

async function migrateLocalToCloud(): Promise<void> {
  const local = loadLocal()
  if (local.length === 0) return
  if (cache.length > 0) {
    clearLocal()
    return
  }
  for (const item of local) {
    await insertSpending(item)
  }
  cache = await fetchSpendings()
  clearLocal()
}

export function isStorageReady(): boolean {
  return ready
}

export function getSpendings(): Spending[] {
  return cache
}

function storageErrorMessage(err: unknown): string {
  const msg = errorToMessage(err, 'Could not load spendings from the database.')
  if (
    msg.includes('Could not find the table') ||
    msg.includes('relation') ||
    msg.includes('schema cache') ||
    msg.includes('PGRST205')
  ) {
    return 'Database table missing. Run supabase/schema.sql in the Supabase SQL Editor, then refresh.'
  }
  return msg
}

export async function initStorage(): Promise<string | null> {
  try {
    cache = await fetchSpendings()
    await migrateLocalToCloud()
    ready = true
    return null
  } catch (err) {
    console.error('initStorage failed:', err)
    cache = []
    ready = true
    return storageErrorMessage(err)
  }
}

export function resetStorage(): void {
  cache = []
  ready = false
}

export async function refreshSpendingsCache(): Promise<Spending[]> {
  cache = await fetchSpendings()
  return cache
}

export async function addSpending(item: Spending): Promise<Spending[]> {
  const saved = await insertSpending(item)
  cache = [saved, ...cache.filter((s) => s.id !== saved.id)]
  return cache
}

export async function removeSpending(id: string): Promise<Spending[]> {
  await deleteRemote(id)
  cache = cache.filter((s) => s.id !== id)
  return cache
}
