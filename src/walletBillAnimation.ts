const BILL_FLY_MS = 1400

export function runWalletBillAnimation(): Promise<void> {
  return new Promise((resolve) => {
    const wallet = document.getElementById('app-wallet')
    if (!wallet) {
      resolve()
      return
    }

    const rect = wallet.getBoundingClientRect()
    const bill = document.createElement('img')
    bill.src = '/cash-bill.png'
    bill.alt = ''
    bill.className = 'app-wallet-bill-overlay'
    bill.style.left = `${rect.left + rect.width * 0.5}px`
    bill.style.top = `${rect.top + rect.height * 0.12}px`
    document.body.appendChild(bill)

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        bill.classList.add('is-flying')
      })
    })

    window.setTimeout(() => {
      bill.remove()
      resolve()
    }, BILL_FLY_MS)
  })
}
