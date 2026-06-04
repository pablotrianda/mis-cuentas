import { db, type InstallmentPurchase, type FixedExpense } from './db'
import type { ExpenseResponseItem } from '../types'

function getInstallmentDate(
  purchaseDate: string,
  index: number,
): { year: number; month: number } {
  const [year, month] = purchaseDate.split('-').map(Number)
  const totalMonths = year! * 12 + (month! - 1) + index
  return {
    year: Math.floor(totalMonths / 12),
    month: (totalMonths % 12) + 1,
  }
}

function projectInstallment(
  purchase: InstallmentPurchase,
  category: { name: string; color: string },
  card: { name: string; color: string } | null,
  targetMonth: string,
): ExpenseResponseItem[] {
  if (!purchase.isActive) return []

  const [targetYear, targetMonthNum] = targetMonth.split('-').map(Number)
  const baseAmount = Math.floor(purchase.totalAmount / purchase.totalInstallments)
  const remainder = purchase.totalAmount - baseAmount * purchase.totalInstallments
  const results: ExpenseResponseItem[] = []

  for (let i = 0; i < purchase.totalInstallments; i++) {
    const { year, month } = getInstallmentDate(purchase.purchaseDate, i)
    if (year === targetYear && month === targetMonthNum) {
      const amount = i === purchase.totalInstallments - 1 ? baseAmount + remainder : baseAmount
      const num = i + 1
      results.push({
        id: `proj-inst-${purchase.id}-${num}`,
        amount,
        description: `${purchase.description} (${num}/${purchase.totalInstallments})`,
        date: `${year}-${String(month).padStart(2, '0')}-01`,
        categoryId: purchase.categoryId,
        categoryName: category.name,
        categoryColor: category.color,
        cardId: purchase.cardId,
        cardName: card?.name ?? null,
        cardColor: card?.color ?? null,
        paymentType: 'installment',
        type: 'installment',
        installmentPurchaseId: purchase.id,
        installmentNumber: num,
        totalInstallments: purchase.totalInstallments,
        fixedExpenseId: null,
        createdAt: null,
      })
    }
  }

  return results
}

function projectFixed(
  fixed: FixedExpense,
  category: { name: string; color: string },
  card: { name: string; color: string } | null,
  targetMonth: string,
): ExpenseResponseItem | null {
  if (!fixed.isActive) return null

  const [year, month] = targetMonth.split('-').map(Number)
  const targetEnd = new Date(year!, month!, 0)
  const startDate = new Date(fixed.startDate)

  if (startDate > targetEnd) return null

  return {
    id: `proj-fixed-${fixed.id}`,
    amount: fixed.amount,
    description: fixed.description,
    date: `${targetMonth}-01`,
    categoryId: fixed.categoryId,
    categoryName: category.name,
    categoryColor: category.color,
    cardId: fixed.cardId,
    cardName: card?.name ?? null,
    cardColor: card?.color ?? null,
    paymentType: 'fixed',
    type: 'fixed',
    installmentPurchaseId: null,
    installmentNumber: null,
    totalInstallments: null,
    fixedExpenseId: fixed.id,
    createdAt: null,
  }
}

function mapRealExpense(
  e: ExpenseResponseItem,
): ExpenseResponseItem {
  return e
}

export async function getProjectedExpenses(month: string): Promise<ExpenseResponseItem[]> {
  const realExpenses = await db.expenses
    .where('date')
    .startsWith(month)
    .toArray()

  const allInstallments = await db.installmentPurchases.toArray()
  const activeInstallments = allInstallments.filter((p) => p.isActive)

  const allFixed = await db.fixedExpenses.toArray()
  const activeFixed = allFixed.filter((f) => f.isActive)

  const allCategories = await db.expenseCategories.toArray()
  const allCards = await db.creditCards.toArray()

  const catMap = new Map(allCategories.map((c) => [c.id, c]))
  const cardMap = new Map(allCards.map((c) => [c.id, c]))

  const realItems: ExpenseResponseItem[] = realExpenses.map((e) => {
    const cat = catMap.get(e.categoryId)
    const card = e.cardId ? cardMap.get(e.cardId) : undefined
    return {
      id: e.id,
      amount: e.amount,
      description: e.description,
      date: e.date,
      categoryId: e.categoryId,
      categoryName: cat?.name ?? '',
      categoryColor: cat?.color ?? '#7B8190',
      cardId: e.cardId,
      cardName: card?.name ?? null,
      cardColor: card?.color ?? null,
      paymentType: e.paymentType,
      type: 'real',
      installmentPurchaseId: e.installmentPurchaseId,
      installmentNumber: null,
      totalInstallments: null,
      fixedExpenseId: null,
      createdAt: e.createdAt,
    }
  })

  const installmentItems = activeInstallments.flatMap((p) => {
    const cat = catMap.get(p.categoryId)
    const card = cardMap.get(p.cardId)
    return projectInstallment(p, cat ?? { name: '', color: '#7B8190' }, card ?? null, month)
  })

  const fixedItems = activeFixed
    .map((f) => {
      const cat = catMap.get(f.categoryId)
      const card = f.cardId ? cardMap.get(f.cardId) : undefined
      return projectFixed(f, cat ?? { name: '', color: '#7B8190' }, card ?? null, month)
    })
    .filter((x): x is ExpenseResponseItem => x !== null)

  return [...realItems, ...installmentItems, ...fixedItems]
}
