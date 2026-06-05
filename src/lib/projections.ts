import { db, type InstallmentPurchase } from './db'
import type { ExpenseResponseItem } from '../types'

function getInstallmentDate(
  purchaseDate: string,
  indexOffset: number,
): { year: number; month: number } {
  const [year, month] = purchaseDate.split('-').map(Number)
  const totalMonths = year! * 12 + (month! - 1) + indexOffset
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
): ExpenseResponseItem | null {
  if (purchase.status !== 'ACTIVE') return null

  const [targetYear, targetMonthNum] = targetMonth.split('-').map(Number)

  const remaining = purchase.totalInstallments - purchase.currentInstallment
  for (let i = 0; i <= remaining; i++) {
    const installmentIndex = purchase.currentInstallment + i - 1
    const { year, month } = getInstallmentDate(purchase.purchaseDate, installmentIndex)
    if (year === targetYear && month === targetMonthNum) {
      const num = purchase.currentInstallment + i
      return {
        id: `proj-inst-${purchase.id}-${num}`,
        amount: purchase.installmentAmount,
        description: `${purchase.description} (${num}/${purchase.totalInstallments})`,
        date: `${year}-${String(month).padStart(2, '0')}-01`,
        categoryId: purchase.categoryId,
        categoryName: category.name,
        categoryColor: category.color,
        cardId: purchase.cardId,
        cardName: card?.name ?? null,
        cardColor: card?.color ?? null,
        paymentType: 'INSTALLMENTS',
        type: 'installment',
        purchaseId: purchase.id,
        installmentNumber: num,
        totalInstallments: purchase.totalInstallments,
        recurringId: null,
        createdAt: null,
      }
    }
  }

  return null
}

export async function getProjectedExpenses(month: string): Promise<ExpenseResponseItem[]> {
  const realExpenses = await db.expenses
    .where('date')
    .startsWith(month)
    .toArray()

  const allInstallments = await db.installmentPurchases.toArray()
  const activeInstallments = allInstallments.filter((p) => p.status === 'ACTIVE')

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
      paymentType: 'ONE_TIME',
      type: 'real',
      purchaseId: null,
      installmentNumber: null,
      totalInstallments: null,
      recurringId: null,
      createdAt: e.createdAt,
    }
  })

  const installmentItems = activeInstallments
    .map((p) => {
      const cat = catMap.get(p.categoryId)
      const card = p.cardId ? cardMap.get(p.cardId) : undefined
      return projectInstallment(p, cat ?? { name: '', color: '#7B8190' }, card ?? null, month)
    })
    .filter((x): x is ExpenseResponseItem => x !== null)

  const [targetYear, targetMonth] = month.split('-').map(Number)

  const occurrences = await db.recurringExpenseOccurrences
    .where('[year+month]')
    .equals([targetYear!, targetMonth!])
    .toArray()

  const allRecurring = await db.recurringExpenses.toArray()
  const recMap = new Map(allRecurring.map((r) => [r.id, r]))

  const recurringItems: ExpenseResponseItem[] = occurrences.map((o) => {
    const rec = recMap.get(o.recurringExpenseId)
    const cat = rec ? catMap.get(rec.categoryId) : undefined
    return {
      id: `proj-rec-${o.id}`,
      amount: o.amount,
      description: rec?.description ?? '',
      date: o.dueDate,
      categoryId: rec?.categoryId ?? '',
      categoryName: cat?.name ?? '',
      categoryColor: cat?.color ?? '#7B8190',
      cardId: rec?.cardId ?? null,
      cardName: null,
      cardColor: null,
      paymentType: 'RECURRING',
      type: 'recurring',
      purchaseId: null,
      installmentNumber: null,
      totalInstallments: null,
      recurringId: rec?.id ?? null,
      createdAt: null,
    }
  })

  return [...realItems, ...installmentItems, ...recurringItems]
}