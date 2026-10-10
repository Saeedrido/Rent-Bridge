export type RentFrequencyValue = 'monthly' | 'quarterly' | 'semi-annually' | 'annually'

export function formatNaira(amount: number): string {
  return '₦' + amount.toLocaleString('en-NG')
}

/**
 * The backend serializes RentFrequency as PascalCase ("Monthly", "SemiAnnually",
 * "Quarterly", "Annually"); some callers may pass the kebab-case form. Normalize
 * both to a single lowercase value, defaulting to annually.
 */
export function normalizeRentFrequency(value: unknown): RentFrequencyValue {
  const raw = String(value ?? '').toLowerCase().replace(/[\s_-]/g, '')
  if (raw === 'monthly') return 'monthly'
  if (raw === 'quarterly') return 'quarterly'
  if (raw === 'semiannually' || raw === 'semiannual') return 'semi-annually'
  return 'annually'
}

export function rentFrequencyLabel(value: unknown): string {
  switch (normalizeRentFrequency(value)) {
    case 'monthly':
      return '/ month'
    case 'quarterly':
      return '/ quarter'
    case 'semi-annually':
      return '/ 6 months'
    default:
      return '/ year'
  }
}

/** Spread form ("payable monthly"), for prose like the agreement rent clause. */
export function rentFrequencyWord(value: unknown): string {
  switch (normalizeRentFrequency(value)) {
    case 'monthly':
      return 'monthly'
    case 'quarterly':
      return 'quarterly'
    case 'semi-annually':
      return 'every 6 months'
    default:
      return 'annually'
  }
}

export function formatPriceLabel(
  price: number,
  listingType: 'rent' | 'sale',
  rentFrequency?: unknown,
): string {
  return listingType === 'rent'
    ? `${formatNaira(price)} ${rentFrequencyLabel(rentFrequency)}`
    : `${formatNaira(price)}`
}
