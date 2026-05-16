export const CURRENCIES = [
  { code: 'USD', label: 'USD — US Dollar' },
  { code: 'EUR', label: 'EUR — Euro' },
  { code: 'GBP', label: 'GBP — British Pound' },
  { code: 'INR', label: 'INR — Indian Rupee' },
  { code: 'JPY', label: 'JPY — Japanese Yen' },
  { code: 'CAD', label: 'CAD — Canadian Dollar' },
  { code: 'AUD', label: 'AUD — Australian Dollar' },
  { code: 'CHF', label: 'CHF — Swiss Franc' },
  { code: 'CNY', label: 'CNY — Chinese Yuan' },
  { code: 'MXN', label: 'MXN — Mexican Peso' },
  { code: 'BRL', label: 'BRL — Brazilian Real' },
  { code: 'KRW', label: 'KRW — South Korean Won' },
  { code: 'SGD', label: 'SGD — Singapore Dollar' },
  { code: 'HKD', label: 'HKD — Hong Kong Dollar' },
  { code: 'NZD', label: 'NZD — New Zealand Dollar' },
  { code: 'SEK', label: 'SEK — Swedish Krona' },
  { code: 'NOK', label: 'NOK — Norwegian Krone' },
  { code: 'DKK', label: 'DKK — Danish Krone' },
  { code: 'PLN', label: 'PLN — Polish Złoty' },
  { code: 'TRY', label: 'TRY — Turkish Lira' },
  { code: 'ZAR', label: 'ZAR — South African Rand' },
  { code: 'AED', label: 'AED — UAE Dirham' },
  { code: 'PHP', label: 'PHP — Philippine Peso' },
  { code: 'THB', label: 'THB — Thai Baht' },
  { code: 'MYR', label: 'MYR — Malaysian Ringgit' },
] as const

export type CurrencyCode = (typeof CURRENCIES)[number]['code']

const STORAGE_KEY = 'spendtrack-currency'
const DEFAULT: CurrencyCode = 'USD'

const codes = new Set<string>(CURRENCIES.map((c) => c.code))

let active: CurrencyCode = DEFAULT

export function initCurrency(): void {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && codes.has(saved)) active = saved as CurrencyCode
  } catch {
    active = DEFAULT
  }
}

export function getCurrency(): CurrencyCode {
  return active
}

export function setCurrency(code: string): void {
  if (!codes.has(code)) return
  active = code as CurrencyCode
  try {
    localStorage.setItem(STORAGE_KEY, active)
  } catch {
    /* ignore quota / private mode */
  }
}

export function renderCurrencySelect(): string {
  const cur = getCurrency()
  const options = CURRENCIES.map(
    (c) =>
      `<option value="${c.code}"${c.code === cur ? ' selected' : ''}>${c.code}</option>`,
  ).join('')
  return `
    <label class="spend-card__currency-wrap">
      <span class="sr-only">Display currency</span>
      <select id="currency-select" class="spend-card__currency-select" aria-label="Display currency">
        ${options}
      </select>
    </label>`
}
