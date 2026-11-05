export function formatCurrency(value) {
  const numericValue = Number(value ?? 0)
  if (Number.isNaN(numericValue)) {
    return 'Rp 0'
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(numericValue)
    .replace('IDR', 'Rp')
}

export function formatDate(dateString) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return dateString
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}
