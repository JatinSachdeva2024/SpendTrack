/** Wait for bottom-sheet close animation (0.28s) plus a short pause */
const SHEET_CLOSE_MS = 420

const CONFETTI_COLORS = ['#ffd54f', '#ffb300', '#ff8a65', '#81c784', '#4fc3f7', '#f48fb1', '#fff59d']

export function isLiteReveal(): boolean {
  return (
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    window.matchMedia('(hover: none) and (pointer: coarse)').matches
  )
}

function rafDouble(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve())
    })
  })
}

/** Resolves when the element's CSS animation ends, with a safety timeout */
function onceAnimationEnd(el: Element, fallbackMs: number): Promise<void> {
  return new Promise((resolve) => {
    let settled = false
    const done = () => {
      if (settled) return
      settled = true
      el.removeEventListener('animationend', onEnd)
      window.clearTimeout(timer)
      resolve()
    }
    const onEnd = (e: Event) => {
      if (e.target !== el) return
      done()
    }
    el.addEventListener('animationend', onEnd)
    const timer = window.setTimeout(done, fallbackMs)
  })
}

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

  widget.classList.remove(
    'widget--reveal',
    'widget--reveal-active',
    'widget--reveal-morph',
    'widget--reveal-lite',
  )
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

  const lite = isLiteReveal()

  window.setTimeout(() => {
    void runRevealSequence(widget, lite, expenseId, onComplete)
  }, lite ? 320 : SHEET_CLOSE_MS)
}

async function runRevealSequence(
  widget: HTMLElement,
  lite: boolean,
  expenseId: string,
  onComplete?: (id: string) => void,
): Promise<void> {
  widget.classList.toggle('widget--reveal-lite', lite)

  if (lite) {
    widget.scrollIntoView({ block: 'nearest' })
  } else {
    widget.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  const coin = widget.querySelector<HTMLElement>('.gold-coin')
  const card = widget.querySelector<HTMLElement>('.widget-reveal-card')
  if (!coin || !card) return

  await rafDouble()
  widget.classList.add('widget--reveal-active')
  await onceAnimationEnd(coin, lite ? 1400 : 2400)

  widget.classList.add('widget--reveal-morph')
  await onceAnimationEnd(card, lite ? 750 : 1300)

  finalizeExpenseReveal(widget)
  onComplete?.(expenseId)

  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    burstConfetti(widget, lite)
  }
}

export function burstConfetti(anchor: Element, lite = false): void {
  const rect = anchor.getBoundingClientRect()
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2

  const layer = document.createElement('div')
  layer.className = 'expense-confetti'
  layer.setAttribute('aria-hidden', 'true')
  document.body.appendChild(layer)

  const count = lite ? 18 : 40
  const durationMs = lite ? 750 : 1000

  for (let i = 0; i < count; i++) {
    const piece = document.createElement('span')
    piece.className = 'expense-confetti-piece'
    if (lite) piece.classList.add('expense-confetti-piece--lite')
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.35
    const dist = lite ? 40 + Math.random() * 55 : 55 + Math.random() * 95
    const w = lite ? 4 + Math.random() * 3 : 5 + Math.random() * 5
    const h = lite ? 3 + Math.random() * 4 : 4 + Math.random() * 6

    piece.style.left = `${cx}px`
    piece.style.top = `${cy}px`
    piece.style.width = `${w}px`
    piece.style.height = `${h}px`
    piece.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length]
    piece.style.setProperty('--tx', `${Math.cos(angle) * dist}px`)
    piece.style.setProperty('--ty', `${Math.sin(angle) * dist - 16}px`)
    piece.style.setProperty('--rot', `${Math.random() * 360 - 180}deg`)
    piece.style.animationDelay = `${Math.random() * 0.08}s`
    layer.appendChild(piece)
  }

  window.setTimeout(() => layer.remove(), durationMs + 300)
}
