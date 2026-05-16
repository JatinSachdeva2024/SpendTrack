import type { Spending } from './types'
import { CATEGORIES, type Category } from './types'
import { colorForShapeIndex } from './widgetShapes'
import { formatDate, formatMoney } from './utils'

function categoryMeta(id: Category) {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1]
}

function escapeHtml(text: string): string {
  const el = document.createElement('div')
  el.textContent = text
  return el.innerHTML
}

function expenseLabel(s: Spending, cat: { label: string }): string {
  return s.note?.trim() || cat.label
}

function expenseTime(s: Spending): string {
  if (!s.createdAt) return '—'
  return new Date(s.createdAt).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function listItemBody(
  s: Spending,
  cat: { label: string; icon: string },
  options: { expanded?: boolean },
): string {
  const label = escapeHtml(expenseLabel(s, cat))
  const expanded = options.expanded ?? false

  return `
    <button
      type="button"
      class="widget-row"
      data-toggle-expand
      aria-expanded="${expanded}"
      aria-controls="widget-details-${s.id}"
    >
      <span class="widget-row-label">${label}</span>
      <span class="widget-row-amount">${formatMoney(s.amount)}</span>
    </button>
    <div
      id="widget-details-${s.id}"
      class="widget-row-details"
      ${expanded ? '' : 'hidden'}
    >
      <div class="widget-detail-fields">
        <div class="widget-detail-field">
          <span class="widget-detail-label">Type</span>
          <span class="widget-detail-value">
            <span class="widget-icon" aria-hidden="true">${cat.icon}</span>
            ${cat.label}
          </span>
        </div>
        <div class="widget-detail-field">
          <span class="widget-detail-label">Date</span>
          <time class="widget-detail-value" datetime="${s.date}">${formatDate(s.date)}</time>
        </div>
        <div class="widget-detail-field">
          <span class="widget-detail-label">Time</span>
          <span class="widget-detail-value">${expenseTime(s)}</span>
        </div>
      </div>
      <button type="button" class="widget-delete" aria-label="Remove ${cat.label} expense" data-delete="${s.id}">×</button>
    </div>`
}

export function renderExpenseWidget(
  s: Spending,
  index: number,
  options?: { reveal?: boolean; expanded?: boolean },
): string {
  const cat = categoryMeta(s.category)
  const theme = colorForShapeIndex(index)
  const reveal = options?.reveal ?? false
  const expanded = options?.expanded ?? false
  const expandedClass = expanded ? ' expense-list-item--expanded' : ''
  const rowContent = listItemBody(s, cat, { expanded })

  const style = `
    --widget-tint: ${theme.tint};
    --widget-tint-light: ${theme.tintLight};
    --widget-on: ${theme.onTint};
  `

  if (reveal) {
    return `
      <div
        class="expense-list-item widget--reveal${expandedClass}"
        data-id="${s.id}"
        style="${style}"
      >
        <div class="widget-reveal-stage">
          <div class="widget-reveal-coin" aria-hidden="true">
            <div class="gold-coin">
              <img
                class="gold-coin-img"
                src="/gold-coin.png"
                alt=""
                width="195"
                height="182"
                decoding="async"
              />
            </div>
          </div>
          <div class="widget-reveal-card">
            ${rowContent}
          </div>
        </div>
      </div>`
  }

  const isNewest = index === 0
  return `
    <div
      class="expense-list-item${isNewest ? ' expense-list-item--newest' : ''}${expandedClass}"
      data-id="${s.id}"
      style="${style}"
    >
      ${rowContent}
    </div>`
}
