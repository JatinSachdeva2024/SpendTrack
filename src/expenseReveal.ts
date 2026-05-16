/** Wait for bottom-sheet close animation (0.28s) plus a short pause */
const SHEET_CLOSE_MS = 420
const COIN_SPIN_MS = 2100
const MORPH_MS = 1100
const CONFETTI_MS = 1200

const CONFETTI_COLORS = ['#ffd54f', '#ffb300', '#ff8a65', '#81c784', '#4fc3f7', '#f48fb1', '#fff59d']

/** Move card out of reveal wrappers so it stays visible after classes are removed */
function finalizeExpenseReveal(widget: HTMLElement): void {
  const stage = widget.querySelector('.widget-reveal-stage')
  const card = widget.querySelector('.widget-reveal-card')
  if (!stage || !card) return

  const fragment = document.createDocumentFragment()
  while (card.firstChild) {
    fragment.appendChild(card.firstChild)
  }
  stage.replaceWith(fragment)

  widget.classList.remove('widget--reveal', 'widget--reveal-active', 'widget--reveal-morph')
  widget.classList.add('expense-list-item--newest', 'widget--settled')
  widget.classList.remove('expense-list-item--expanded')
}

export function runExpenseReveal(
  expenseId: string,
  onComplete?: (id: string) => void,
): void {
  const widget = document.querySelector<HTMLElement>(
    `.expense-list-item.widget--reveal[data-id="${expenseId}"]`,
  )
  if (!widget) return

  window.setTimeout(() => {
    widget.scrollIntoView({ behavior: 'smooth', block: 'nearest' })

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        widget.classList.add('widget--reveal-active')

        window.setTimeout(() => {
          widget.classList.add('widget--reveal-morph')

          window.setTimeout(() => {
            finalizeExpenseReveal(widget)
            onComplete?.(expenseId)
            burstConfetti(widget)
          }, MORPH_MS)
        }, COIN_SPIN_MS)
      })
    })
  }, SHEET_CLOSE_MS)
}

export function burstConfetti(anchor: Element, durationMs = CONFETTI_MS): void {
  const rect = anchor.getBoundingClientRect()
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2

  const layer = document.createElement('div')
  layer.className = 'expense-confetti'
  layer.setAttribute('aria-hidden', 'true')
  document.body.appendChild(layer)

  const count = 52
  for (let i = 0; i < count; i++) {
    const piece = document.createElement('span')
    piece.className = 'expense-confetti-piece'
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4
    const dist = 55 + Math.random() * 95
    const w = 5 + Math.random() * 5
    const h = 4 + Math.random() * 6

    piece.style.left = `${cx}px`
    piece.style.top = `${cy}px`
    piece.style.width = `${w}px`
    piece.style.height = `${h}px`
    piece.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length]
    piece.style.setProperty('--tx', `${Math.cos(angle) * dist}px`)
    piece.style.setProperty('--ty', `${Math.sin(angle) * dist - 20}px`)
    piece.style.setProperty('--rot', `${Math.random() * 540 - 270}deg`)
    piece.style.animationDelay = `${Math.random() * 0.12}s`
    layer.appendChild(piece)
  }

  window.setTimeout(() => layer.remove(), durationMs + 350)
}
