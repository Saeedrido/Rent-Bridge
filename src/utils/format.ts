export function formatNaira(amount: number): string {
  return '₦' + amount.toLocaleString('en-NG')
}

export function formatPriceLabel(price: number, listingType: 'rent' | 'sale'): string {
  return listingType === 'rent'
    ? `${formatNaira(price)} / year`
    : `${formatNaira(price)}`
}
