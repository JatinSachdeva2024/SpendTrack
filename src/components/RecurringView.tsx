import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { IconBell, IconTrash } from '@tabler/icons-react'
import {
  addRecurringExpense,
  getRecurringExpenses,
  initRecurringStorage,
  removeRecurringExpense,
} from '../recurringStorage'
import {
  requestRecurringNotificationPermission,
  runRecurringReminderCheck,
} from '../recurringReminder'
import { refreshSpendingsCache } from '../storage'
import { CATEGORIES, type Category, type RecurringExpense } from '../types'
import { errorToMessage, formatMoney } from '../utils'
import '../recurring.css'

export function RecurringView() {
  const [items, setItems] = useState<RecurringExpense[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [notifyOn, setNotifyOn] = useState(
    () => typeof Notification !== 'undefined' && Notification.permission === 'granted',
  )

  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<Category>('bills')
  const [note, setNote] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      await initRecurringStorage()
      setItems(getRecurringExpenses())
    } catch (err) {
      setError(errorToMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function handleEnableNotifications() {
    const ok = await requestRecurringNotificationPermission()
    setNotifyOn(ok)
    if (ok) {
      setMessage('You’ll get a reminder on the 1st when you open SpendTrack (or if the app is open).')
      const spendings = await refreshSpendingsCache()
      runRecurringReminderCheck(spendings)
    } else {
      setMessage('Notifications blocked. You can still use the in-app banner on the 1st–3rd.')
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    const value = Number(amount)
    if (!value || value <= 0) {
      setError('Enter a valid amount.')
      return
    }
    const label = note.trim()
    if (!label) {
      setError('Add a label (e.g. Rent, Netflix).')
      return
    }

    setSaving(true)
    try {
      const item: RecurringExpense = {
        id: crypto.randomUUID(),
        amount: value,
        category,
        note: label,
        active: true,
      }
      const next = await addRecurringExpense(item)
      setItems(next)
      setAmount('')
      setNote('')
      setMessage('Recurring expense saved. We’ll remind you on the 1st of each month.')
    } catch (err) {
      setError(errorToMessage(err))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setError(null)
    try {
      const next = await removeRecurringExpense(id)
      setItems(next)
    } catch (err) {
      setError(errorToMessage(err))
    }
  }

  return (
    <div className="recurring-view">
      <div className="recurring-view-surface">
        <h2 className="recurring-view-title">Recurring expenses</h2>
        <p className="recurring-view-lead">
          Monthly bills that repeat on the <strong>1st</strong>. On the first few days of each month
          we’ll remind you to add them to this month’s spending.
        </p>

        <button
          type="button"
          className="recurring-notify-btn"
          onClick={() => void handleEnableNotifications()}
          disabled={notifyOn}
        >
          <IconBell className="recurring-notify-btn__icon" aria-hidden />
          {notifyOn ? 'Monthly reminders enabled' : 'Enable monthly reminders'}
        </button>

        <form className="recurring-form" onSubmit={(e) => void handleSubmit(e)} noValidate>
          <div className="recurring-form-row">
            <label className="recurring-field">
              <span className="recurring-label">Amount</span>
              <input
                className="recurring-input"
                type="number"
                min="0.01"
                step="0.01"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </label>
            <label className="recurring-field">
              <span className="recurring-label">Category</span>
              <select
                className="recurring-input"
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="recurring-field">
            <span className="recurring-label">Label</span>
            <input
              className="recurring-input"
              type="text"
              maxLength={80}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Rent, gym, Netflix…"
              required
            />
          </label>
          <button type="submit" className="recurring-submit" disabled={saving}>
            {saving ? 'Saving…' : 'Add recurring'}
          </button>
        </form>

        {error ? (
          <p className="recurring-error" role="alert">
            {error}
          </p>
        ) : null}
        {message ? <p className="recurring-message">{message}</p> : null}

        <section className="recurring-list-section" aria-label="Your recurring expenses">
          <h3 className="recurring-list-heading">Your list</h3>
          {loading ? (
            <p className="recurring-muted">Loading…</p>
          ) : items.length === 0 ? (
            <p className="recurring-muted">No recurring expenses yet.</p>
          ) : (
            <ul className="recurring-list">
              {items.map((r) => {
                const cat = CATEGORIES.find((c) => c.id === r.category)
                return (
                  <li key={r.id} className="recurring-list-item">
                    <div className="recurring-list-item__main">
                      <span className="recurring-list-item__icon" aria-hidden>
                        {cat?.icon ?? '📦'}
                      </span>
                      <div className="recurring-list-item__text">
                        <span className="recurring-list-item__name">{r.note}</span>
                        <span className="recurring-list-item__meta">{cat?.label ?? r.category}</span>
                      </div>
                    </div>
                    <span className="recurring-list-item__amount">{formatMoney(r.amount)}</span>
                    <button
                      type="button"
                      className="recurring-list-item__delete"
                      aria-label={`Remove ${r.note}`}
                      onClick={() => void handleDelete(r.id)}
                    >
                      <IconTrash className="h-4 w-4" aria-hidden />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
