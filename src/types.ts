export type Category =
  | 'food'
  | 'transport'
  | 'shopping'
  | 'bills'
  | 'entertainment'
  | 'health'
  | 'other'

export interface Spending {
  id: string
  amount: number
  category: Category
  note: string
  date: string // YYYY-MM-DD
  createdAt?: number // ms — used for newest-first widget order
}

export interface Profile {
  id: string
  firstName: string
  lastName: string
  phone: string
  createdAt?: string
  updatedAt?: string
}

export interface SignupProfileInput {
  firstName: string
  lastName: string
  phone: string
}

/** Category accent (icon context); container tint comes from shape palette. */
export const CATEGORY_WIDGET: Record<
  Category,
  { tint: string; onTint: string }
> = {
  food: { tint: '#f5ddd0', onTint: '#5c4030' },
  transport: { tint: '#d4e3f5', onTint: '#304058' },
  shopping: { tint: '#f5d4e8', onTint: '#583048' },
  bills: { tint: '#e0d4f5', onTint: '#403058' },
  entertainment: { tint: '#d8f0d4', onTint: '#385830' },
  health: { tint: '#d4f0ec', onTint: '#305850' },
  other: { tint: '#ebe4d8', onTint: '#504840' },
}

/** Total card — frosted zen glass. */
export const TOTAL_WIDGET = {
  tint: '#3c3c40',
  tintLight: '#54545a',
  onTint: '#f4f4f1',
}

/** Logo / title bar at top. */
export const LOGO_WIDGET = {
  tint: '#444448',
  tintLight: '#5c5c62',
  onTint: '#f4f4f1',
}

/** Weekly chart card. */
export const CHART_WIDGET = {
  tint: '#38383c',
  tintLight: '#505056',
  onTint: '#f4f4f1',
}

export const CATEGORIES: { id: Category; label: string; icon: string }[] = [
  { id: 'food', label: 'Food', icon: '🍽️' },
  { id: 'transport', label: 'Transport', icon: '🚌' },
  { id: 'shopping', label: 'Shopping', icon: '🛍️' },
  { id: 'bills', label: 'Bills', icon: '📄' },
  { id: 'entertainment', label: 'Fun', icon: '🎬' },
  { id: 'health', label: 'Health', icon: '💊' },
  { id: 'other', label: 'Other', icon: '📦' },
]
