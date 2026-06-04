import type { InstallmentPurchase } from './db'

export interface DebtSummary {
  futureDebt: number
  pendingInstallments: number
  nextMonthAmount: number
}

export interface CardDebtGroup {
  cardId: string | null
  cardName: string
  cardColor: string
  monthlyAmount: number
  remainingDebt: number
  purchaseCount: number
}

export function computeDebtSummary(items: InstallmentPurchase[]): DebtSummary {
  const active = items.filter((i) => i.status === 'ACTIVE')
  const futureDebt = active.reduce(
    (s, i) => s + (i.totalInstallments - i.currentInstallment + 1) * i.installmentAmount,
    0,
  )
  const pendingInstallments = active.reduce(
    (s, i) => s + (i.totalInstallments - i.currentInstallment + 1),
    0,
  )
  const nextMonthAmount = active.reduce((s, i) => s + i.installmentAmount, 0)
  return { futureDebt, pendingInstallments, nextMonthAmount }
}

export function computeCardGroups(
  items: InstallmentPurchase[],
  cardMap: Map<string, { name: string; color: string; brand: string }>,
): CardDebtGroup[] {
  const active = items.filter((i) => i.status === 'ACTIVE')
  const groups = new Map<string, CardDebtGroup>()

  for (const item of active) {
    const key = item.cardId ?? '__none'
    if (!groups.has(key)) {
      const card = item.cardId ? cardMap.get(item.cardId) : undefined
      groups.set(key, {
        cardId: item.cardId,
        cardName: card?.name ?? 'Sin tarjeta',
        cardColor: card?.color ?? '#6B7280',
        monthlyAmount: 0,
        remainingDebt: 0,
        purchaseCount: 0,
      })
    }
    const g = groups.get(key)!
    g.monthlyAmount += item.installmentAmount
    g.remainingDebt += (item.totalInstallments - item.currentInstallment + 1) * item.installmentAmount
    g.purchaseCount += 1
  }

  return [...groups.values()]
}

export function computeRemainingDebt(purchase: InstallmentPurchase): number {
  return (purchase.totalInstallments - purchase.currentInstallment + 1) * purchase.installmentAmount
}

export function computeRemainingInstallments(purchase: InstallmentPurchase): number {
  return purchase.totalInstallments - purchase.currentInstallment + 1
}

export function computeProgress(purchase: InstallmentPurchase): number {
  return purchase.currentInstallment / purchase.totalInstallments
}

export function computeEndDate(purchase: InstallmentPurchase): string {
  const [year, month] = purchase.purchaseDate.split('-').map(Number)
  const totalMonths = year! * 12 + (month! - 1) + purchase.totalInstallments
  const endYear = Math.floor(totalMonths / 12)
  const endMonth = (totalMonths % 12) + 1
  return `${endYear}-${String(endMonth).padStart(2, '0')}`
}

export function computeIsFinished(purchase: InstallmentPurchase): boolean {
  return purchase.currentInstallment >= purchase.totalInstallments
}

function getInstallmentMonth(purchaseDate: string, indexOffset: number): string {
  const [year, month] = purchaseDate.split('-').map(Number)
  const totalMonths = year! * 12 + (month! - 1) + indexOffset
  const y = Math.floor(totalMonths / 12)
  const m = (totalMonths % 12) + 1
  return `${y}-${String(m).padStart(2, '0')}`
}

export function computeDebtFromMonth(
  items: InstallmentPurchase[],
  refMonth: string,
): DebtSummary {
  const active = items.filter((i) => i.status === 'ACTIVE')
  let futureDebt = 0
  let pendingInstallments = 0
  let nextMonthAmount = 0

  for (const p of active) {
    for (let i = p.currentInstallment - 1; i < p.totalInstallments; i++) {
      const instMonth = getInstallmentMonth(p.purchaseDate, i)
      if (instMonth >= refMonth) {
        futureDebt += p.installmentAmount
        pendingInstallments += 1
        if (instMonth === refMonth) {
          nextMonthAmount += p.installmentAmount
        }
      }
    }
  }

  return { futureDebt, pendingInstallments, nextMonthAmount }
}
