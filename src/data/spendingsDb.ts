import { supabase } from '../lib/supabase'
import type { Category, Spending } from '../types'

type SpendingRow = {
  id: string
  user_id: string
  amount: number
  category: string
  note: string
  date: string
  created_at: string
}

function rowToSpending(row: SpendingRow): Spending {
  return {
    id: row.id,
    amount: Number(row.amount),
    category: row.category as Category,
    note: row.note ?? '',
    date: row.date,
    createdAt: new Date(row.created_at).getTime(),
  }
}

export async function fetchSpendings(): Promise<Spending[]> {
  const { data, error } = await supabase
    .from('spendings')
    .select('id, user_id, amount, category, note, date, created_at')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data as SpendingRow[]).map(rowToSpending)
}

export async function insertSpending(item: Spending): Promise<Spending> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')

  const { data, error } = await supabase
    .from('spendings')
    .insert({
      id: item.id,
      user_id: user.id,
      amount: item.amount,
      category: item.category,
      note: item.note,
      date: item.date,
    })
    .select('id, user_id, amount, category, note, date, created_at')
    .single()

  if (error) throw error
  return rowToSpending(data as SpendingRow)
}

export async function deleteSpending(id: string): Promise<void> {
  const { error } = await supabase.from('spendings').delete().eq('id', id)
  if (error) throw error
}
