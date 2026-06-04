const currencyFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const dateFormatter = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: '2-digit',
})

const monthFormatter = new Intl.DateTimeFormat('es-AR', {
  month: 'long',
  year: 'numeric',
})

export function formatARS(cents: number): string {
  return currencyFormatter.format(cents / 100)
}

export function formatDate(isoString: string): string {
  const d = new Date(isoString + 'T12:00:00')
  return dateFormatter.format(d)
}

export function formatMonth(month: string): string {
  const [year, m] = month.split('-').map(Number)
  const d = new Date(year!, m! - 1, 1)
  return monthFormatter.format(d)
}

const shortMonthFormatter = new Intl.DateTimeFormat('es-AR', {
  month: 'short',
  year: 'numeric',
})

export function formatShortMonth(month: string): string {
  const [year, m] = month.split('-').map(Number)
  const d = new Date(year!, m! - 1, 1)
  return shortMonthFormatter.format(d)
}

export function centsToDecimal(cents: number): string {
  return (cents / 100).toFixed(2)
}

export function decimalToCents(decimal: string): number {
  return Math.round(parseFloat(decimal) * 100)
}
