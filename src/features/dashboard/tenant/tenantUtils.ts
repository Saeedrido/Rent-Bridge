export function formatPrice(amount: number): string {
  return `₦${amount.toLocaleString('en-NG')}`
}

export function formatNaira(amount: number): string {
  return '₦' + amount.toLocaleString('en-NG')
}