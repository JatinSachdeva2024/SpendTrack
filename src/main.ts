import './style.css'
import {
  CATEGORIES,
  CHART_WIDGET,
  LOGO_WIDGET,
  TOTAL_WIDGET,
  type Category,
  type Spending,
} from './types'
import { initCurrency, renderCurrencySelect, setCurrency } from './currency'
import { isLiteReveal, runExpenseReveal } from './expenseReveal'
import { runWalletBillAnimation } from './walletBillAnimation'
import { renderExpenseWidget } from './expenseWidget'
import {
  addSpending,
  getSpendings,
  initStorage,
  removeSpending,
} from './storage'
import {
  compareMonths,
  currentMonthKey,
  filterByMonth,
  formatMoney,
  monthLabel,
  previousMonthKey,
  sumAmount,
  todayISO,
  weeklyTotalsForMonth,
  sortNewestFirst,
  errorToMessage,
} from './utils'

let spendings: Spending[] = []
let sheetOpen = false
let dbWarning: string | null = null
let appView: AppView = 'dashboard'
let revealExpenseId: string | null = null
let expandedExpenseId: string | null = null

let app: HTMLDivElement | null = null
let appClickBound = false

export type AppView = 'dashboard' | 'lastMonth' | 'profile'

export function setAppView(view: AppView): void {
  appView = view
  if (app) render()
}

export function getAppView(): AppView {
  return appView
}

export async function mountSpendTrack(root: HTMLElement): Promise<void> {
  app = root as HTMLDivElement
  initCurrency()
  dbWarning = await initStorage()
  spendings = getSpendings()
  render()
}

export function unmountSpendTrack(): void {
  app = null
  spendings = []
  sheetOpen = false
  dbWarning = null
  appView = 'dashboard'
  revealExpenseId = null
  expandedExpenseId = null
  appClickBound = false
}

function renderWeeklyChart(weeks: { week: number; total: number; label: string }[]): string {
  const max = Math.max(...weeks.map((w) => w.total), 1)
  const bars = weeks
    .map((w) => {
      const h = Math.max((w.total / max) * 100, w.total > 0 ? 8 : 4)
      const active = w.total > 0 ? 'bar-fill--active' : ''
      return `
        <div class="bar-group">
          <div class="bar-track" aria-hidden="true">
            <div class="bar-fill ${active}" style="height: ${h}%"></div>
          </div>
          <span class="bar-value">${w.total > 0 ? formatMoney(w.total) : '—'}</span>
          <span class="bar-label">${w.label}</span>
        </div>`
    })
    .join('')

  return `<div class="chart-bars" role="img" aria-label="Weekly spending this month">${bars}</div>`
}

function renderComparison(current: number, previous: number): string {
  const { diff, percent, improved } = compareMonths(current, previous)
  const sign = diff > 0 ? '+' : ''
  const trendClass = improved ? 'trend--down' : diff === 0 ? 'trend--neutral' : 'trend--up'
  const trendIcon = improved ? '↓' : diff === 0 ? '→' : '↑'
  const percentText =
    percent === null
      ? 'No spending last month'
      : percent === 0
        ? 'Same as last month'
        : `${Math.abs(percent)}% ${improved ? 'less' : 'more'} than last month`

  return `
    <div class="comparison ${trendClass}">
      <div class="comparison-row">
        <span class="comparison-icon" aria-hidden="true">${trendIcon}</span>
        <div class="comparison-text">
          <p class="comparison-diff">${sign}${formatMoney(diff)} vs last month</p>
          <p class="comparison-meta">${percentText}</p>
        </div>
      </div>
      <div class="comparison-pills">
        <span class="pill">This month <strong>${formatMoney(current)}</strong></span>
        <span class="pill pill--muted">Last month <strong>${formatMoney(previous)}</strong></span>
      </div>
    </div>`
}

function renderExpenseWidgets(items: Spending[]): string {
  const sorted = sortNewestFirst(items)

  if (sorted.length === 0) {
    return `
      <div class="widget-board widget-board--empty" aria-label="No expenses yet">
        <p class="widget-empty">Tap <strong>+</strong> to add your first expense</p>
      </div>`
  }

  const widgets = sorted
    .map((s, index) =>
      renderExpenseWidget(s, index, {
        reveal: s.id === revealExpenseId,
        expanded: s.id === expandedExpenseId,
      }),
    )
    .join('')

  return `
    <div class="widget-board" aria-label="Recent expenses">
      <div class="expense-list">
        <div class="expense-list-surface widget-surface">${widgets}</div>
      </div>
    </div>`
}

function renderAddSheet(): string {
  if (!sheetOpen) return ''

  const categoryOptions = CATEGORIES.map(
    (c) => `<option value="${c.id}">${c.icon} ${c.label}</option>`,
  ).join('')

  return `
    <div class="sheet-backdrop" data-close-sheet></div>
    <div class="sheet" role="dialog" aria-labelledby="sheet-title" aria-modal="true">
      <div class="sheet-handle" aria-hidden="true"></div>
      <h2 id="sheet-title" class="sheet-title">Add spending</h2>
      <form id="add-form" class="add-form">
        <label class="field">
          <span class="field-label">Amount</span>
          <input type="number" name="amount" min="0.01" step="0.01" inputmode="decimal" required placeholder="0.00" />
        </label>
        <label class="field">
          <span class="field-label">Category</span>
          <select name="category" required>${categoryOptions}</select>
        </label>
        <label class="field">
          <span class="field-label">Date</span>
          <input type="date" name="date" required value="${todayISO()}" />
        </label>
        <label class="field">
          <span class="field-label">Note <span class="optional">(optional)</span></span>
          <input type="text" name="note" maxlength="80" placeholder="Coffee, groceries…" />
        </label>
        <div class="sheet-actions">
          <button type="button" class="btn btn--text" data-close-sheet>Cancel</button>
          <button type="submit" class="btn btn--filled">Save</button>
        </div>
      </form>
    </div>`
}

function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

function render(): void {
  if (!app) return

  const currentKey = currentMonthKey()
  const isLastMonthView = appView === 'lastMonth'
  const month = isLastMonthView ? previousMonthKey(currentKey) : currentKey
  const prevKey = previousMonthKey(currentKey)
  const thisMonth = filterByMonth(spendings, month)
  const lastMonth = filterByMonth(spendings, prevKey)
  const currentTotal = sumAmount(thisMonth)
  const previousTotal = sumAmount(lastMonth)
  const weeks = weeklyTotalsForMonth(spendings, month)
  const showFab = !isLastMonthView

  app.innerHTML = `
      ${
        dbWarning
          ? `<div class="db-banner" role="alert"><p>${escapeHtml(
              typeof dbWarning === 'string' ? dbWarning : errorToMessage(dbWarning),
            )}</p></div>`
          : ''
      }
      <header class="app-header">
        <div class="logo-widget">
          <div
            class="logo-widget-surface app-top-bar"
            style="
              --logo-tint: ${LOGO_WIDGET.tint};
              --logo-tint-light: ${LOGO_WIDGET.tintLight};
              --logo-on: ${LOGO_WIDGET.onTint};
            "
          >
            <div class="app-top-bar__text">
              <h1 class="app-title">SpendTrack</h1>
              <p class="app-subtitle">${monthLabel(month)}${isLastMonthView ? ' · Last month' : ''}</p>
            </div>
            <div class="app-top-bar__wallet" id="app-wallet" aria-hidden="true">
              <img class="app-wallet-img" src="/wallet.png" alt="" width="150" height="170" decoding="async" />
              <img
                id="wallet-bill"
                class="app-wallet-bill"
                src="/cash-bill.png"
                alt=""
                width="140"
                height="60"
                decoding="async"
                hidden
              />
            </div>
          </div>
        </div>
      </header>

      <div class="total-widget" aria-labelledby="total-label">
        <article
          class="total-widget-surface spend-card"
          style="
            --total-tint: ${TOTAL_WIDGET.tint};
            --total-tint-light: ${TOTAL_WIDGET.tintLight};
            --total-on: ${TOTAL_WIDGET.onTint};
          "
        >
          <span class="spend-card__shine" aria-hidden="true"></span>
          <span class="spend-card__chip" aria-hidden="true"></span>
          <svg class="spend-card__contactless" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="currentColor" d="M8.5 10.5a1.5 1.5 0 0 1 3 0v3a1.5 1.5 0 0 1-3 0v-3zm4.5-1.8a4.3 4.3 0 0 1 0 8.6v-1.2a3.1 3.1 0 0 0 0-6.2v-1.2zm4.5-1.8a7 7 0 0 1 0 14v-1.2a5.8 5.8 0 0 0 0-11.6V7z"/>
          </svg>
          <span class="spend-card__brand">SpendTrack</span>
          ${renderCurrencySelect()}
          <div class="spend-card__body total-widget-content">
            <p id="total-label" class="total-label spend-card__label">${
              isLastMonthView ? 'Total last month' : 'Total this month'
            }</p>
            <p class="total-amount spend-card__amount">${formatMoney(currentTotal)}</p>
            ${isLastMonthView ? '' : renderComparison(currentTotal, previousTotal)}
          </div>
        </article>
      </div>

      ${renderExpenseWidgets(thisMonth)}

      <section class="chart-widget" aria-labelledby="chart-title">
        <div
          class="chart-widget-surface"
          style="
            --chart-tint: ${CHART_WIDGET.tint};
            --chart-tint-light: ${CHART_WIDGET.tintLight};
            --chart-on: ${CHART_WIDGET.onTint};
          "
        >
          <div class="chart-widget-content">
            <h2 id="chart-title" class="chart-heading">${
              isLastMonthView ? 'Weekly spending (last month)' : 'Weekly spending'
            }</h2>
            <p class="chart-hint">${monthLabel(month)} · ${weeks.length} weeks</p>
            ${renderWeeklyChart(weeks)}
          </div>
        </div>
      </section>

      ${
        showFab
          ? `<button type="button" class="fab" id="fab-add" aria-label="Add spending">
        <span aria-hidden="true">+</span>
      </button>
      ${renderAddSheet()}`
          : ''
      }
  `

  bindEvents()

  if (revealExpenseId) {
    const id = revealExpenseId
    revealExpenseId = null
    window.setTimeout(() => {
      if (!isLiteReveal()) void runWalletBillAnimation()
      runExpenseReveal(id)
    }, isLiteReveal() ? 280 : 380)
  }
}

function bindEvents(): void {
  document.getElementById('currency-select')?.addEventListener('change', (e) => {
    const code = (e.target as HTMLSelectElement).value
    setCurrency(code)
    render()
  })

  document.getElementById('fab-add')?.addEventListener('click', () => {
    sheetOpen = true
    render()
    const amountInput = document.querySelector<HTMLInputElement>('input[name="amount"]')
    amountInput?.focus()
  })

  document.querySelectorAll('[data-close-sheet]').forEach((el) => {
    el.addEventListener('click', () => {
      sheetOpen = false
      render()
    })
  })

  document.getElementById('add-form')?.addEventListener('submit', (e) => {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const data = new FormData(form)
    const amount = Number(data.get('amount'))
    const category = data.get('category') as Category
    const date = String(data.get('date'))
    const note = String(data.get('note') || '').trim()

    if (!amount || amount <= 0) return

    const item: Spending = {
      id: crypto.randomUUID(),
      amount,
      category,
      date,
      note,
      createdAt: Date.now(),
    }

    void addSpending(item)
      .then((items) => {
        spendings = items
        sheetOpen = false
        revealExpenseId = item.id
        render()
      })
      .catch((err) => {
        console.error(err)
        alert(errorToMessage(err, 'Could not save spending.'))
      })
  })

  if (app && !appClickBound) {
    appClickBound = true
    app.addEventListener('click', (e) => {
      const deleteBtn = (e.target as HTMLElement).closest<HTMLElement>('[data-delete]')
      if (deleteBtn && app?.contains(deleteBtn)) {
        e.stopPropagation()
        const id = deleteBtn.dataset.delete
        if (!id) return
        if (expandedExpenseId === id) expandedExpenseId = null
        void removeSpending(id)
          .then((items) => {
            spendings = items
            render()
          })
          .catch((err) => {
            console.error(err)
            alert(errorToMessage(err, 'Could not delete spending.'))
          })
        return
      }

      const toggle = (e.target as HTMLElement).closest<HTMLElement>('[data-toggle-expand]')
      if (!toggle || !app?.contains(toggle)) return
      const widget = toggle.closest<HTMLElement>('.expense-list-item')
      const id = widget?.dataset.id
      if (!id) return
      expandedExpenseId = expandedExpenseId === id ? null : id
      render()
    })
  }
}
