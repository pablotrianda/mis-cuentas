import type { DashboardData } from '@miscuentas/shared'
import { getProjectedExpenses } from './projections'
import { db } from './db'

export async function getDashboardData(month: string): Promise<DashboardData> {
  const incomes = await db.incomes
    .where('date')
    .startsWith(month)
    .toArray()

  const projectedExpenses = await getProjectedExpenses(month)

  const totalIncomes = incomes.reduce((sum, i) => sum + i.amount, 0)
  const totalExpenses = projectedExpenses.reduce((sum, e) => sum + e.amount, 0)

  const singleTotal = projectedExpenses
    .filter((e) => e.paymentType === 'single')
    .reduce((sum, e) => sum + e.amount, 0)
  const installmentTotal = projectedExpenses
    .filter((e) => e.paymentType === 'installment')
    .reduce((sum, e) => sum + e.amount, 0)
  const fixedTotal = projectedExpenses
    .filter((e) => e.paymentType === 'fixed')
    .reduce((sum, e) => sum + e.amount, 0)

  const cardTotals = new Map<string, { cardName: string; cardColor: string; amount: number }>()
  projectedExpenses.forEach((e) => {
    if (e.cardId) {
      const prev = cardTotals.get(e.cardId)
      cardTotals.set(e.cardId, {
        cardName: e.cardName ?? '',
        cardColor: e.cardColor ?? '#7B8190',
        amount: (prev?.amount ?? 0) + e.amount,
      })
    }
  })

  const catTotals = new Map<string, { name: string; color: string; amount: number }>()
  projectedExpenses.forEach((e) => {
    const prev = catTotals.get(e.categoryId)
    catTotals.set(e.categoryId, {
      name: e.categoryName,
      color: e.categoryColor,
      amount: (prev?.amount ?? 0) + e.amount,
    })
  })

  const categoryBreakdown = [...catTotals.entries()].map(([categoryId, v]) => ({
    categoryId,
    categoryName: v.name,
    color: v.color,
    amount: v.amount,
    percentage: totalExpenses > 0 ? Math.round((v.amount / totalExpenses) * 10000) / 100 : 0,
  }))

  const sortedByDate = [...projectedExpenses].sort((a, b) => b.date.localeCompare(a.date) || (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
  const recentTransactions = sortedByDate.slice(0, 5).map((e) => ({
    id: e.id,
    amount: e.amount,
    description: e.description,
    date: e.date,
    type: e.type,
    categoryName: e.categoryName,
    categoryColor: e.categoryColor,
  }))

  return {
    totalIncomes,
    totalExpenses,
    balance: totalIncomes - totalExpenses,
    totalByPaymentType: {
      single: singleTotal,
      installment: installmentTotal,
      fixed: fixedTotal,
    },
    perCardSpending: [...cardTotals.entries()].map(([cardId, v]) => ({
      cardId,
      cardName: v.cardName,
      cardColor: v.cardColor,
      amount: v.amount,
    })),
    categoryBreakdown,
    recentTransactions,
  }
}
