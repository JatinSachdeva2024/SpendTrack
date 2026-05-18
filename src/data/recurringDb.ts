import { supabase } from '../lib/supabase'
import type { Category, RecurringExpense } from '../types'

type RecurringRow = {
  id: string
  user_id: string
  amount: number
  category: string
  note: string
  active: boolean
  created_at: string
}

function rowToRecurring(row: RecurringRow): RecurringExpense {
  return {
    id: row.id,
    amount: Number(row.amount),
    category: row.category as Category,
    note: row.note ?? '',
    active: row.active,
    createdAt: new Date(row.created_at).getTime(),
  }
}

export async function fetchRecurringExpenses(): Promise<RecurringExpense[]> {
  const { data, error } = await supabase
    .from('recurring_expenses')
    .select('id, user_id, amount, category, note, active, created_at')
    .eq('active', true)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data as RecurringRow[]).map(rowToRecurring)
}

export async function insertRecurringExpense(
  item: RecurringExpense,
): Promise<RecurringExpense> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')

  const { data, error } = await supabase
    .from('recurring_expenses')
    .insert({
      id: item.id,
      user_id: user.id,
      amount: item.amount,
      category: item.category,
      note: item.note,
      active: true,
    })
    .select('id, user_id, amount, category, note, active, created_at')
    .single()

  if (error) throw error
  return rowToRecurring(data as RecurringRow)
}

export async function deleteRecurringExpense(id: string): Promise<void> {
  const { error } = await supabase.from('recurring_expenses').delete().eq('id', id)
  if (error) throw error
}
