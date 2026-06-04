import { create } from 'zustand'
import { db, generateId, type Expense } from '../lib/db'
import type { CreateOneTimeExpense } from '../lib/shared-types'
import type { ExpenseResponseItem } from '../types'
import { getProjectedExpenses } from '../lib/projections'

interface ExpenseState {
  items: ExpenseResponseItem[]
  loading: boolean
  error: string | null
  month: string
  typeFilter: string | null
  setMonth: (month: string) => void
  setTypeFilter: (type: string | null) => void
  fetchAll: () => Promise<void>
  addOneTime: (data: CreateOneTimeExpense) => Promise<void>
  remove: (id: string) => Promise<void>
}

function currentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export const useExpenseStore = create<ExpenseState>((set, get) => ({
  items: [],
  loading: false,
  error: null,
  month: currentMonth(),
  typeFilter: null,
  setMonth: (month) => {
    set({ month })
    get().fetchAll()
  },
  setTypeFilter: (typeFilter) => {
    set({ typeFilter })
  },
  fetchAll: async () => {
    const { month, typeFilter } = get()
    set({ loading: true, error: null })
    try {
      let items = await getProjectedExpenses(month)
      if (typeFilter) {
        items = items.filter((e) => e.paymentType === typeFilter)
      }
      items.sort(
        (a, b) => b.date.localeCompare(a.date) || (b.createdAt ?? '').localeCompare(a.createdAt ?? ''),
      )
      set({ items, loading: false })
    } catch (e) {
      set({ error: (e as Error).message, loading: false })
    }
  },
  addOneTime: async (data) => {
    const now = new Date().toISOString()
    const expense: Expense = {
      id: generateId(),
      amount: data.amount,
      description: data.description,
      date: data.date,
      categoryId: data.categoryId,
      cardId: data.cardId ?? null,
      paymentType: 'ONE_TIME',
      createdAt: now,
    }
    try {
      await db.expenses.add(expense)
      await get().fetchAll()
    } catch (e) {
      set({ error: (e as Error).message })
    }
  },
  remove: async (id) => {
    try {
      if (id.startsWith('proj-inst-')) {
        const rest = id.slice('proj-inst-'.length)
        const lastDash = rest.lastIndexOf('-')
        const purchaseId = rest.slice(0, lastDash)
        await db.installmentPurchases.update(purchaseId, { status: 'FINISHED' })
      } else if (id.startsWith('proj-rec-')) {
        const recurringId = id.slice('proj-rec-'.length)
        await db.recurringExpenses.update(recurringId, { active: false })
      } else {
        await db.expenses.delete(id)
      }
      await get().fetchAll()
    } catch (e) {
      set({ error: (e as Error).message })
    }
  },
}))
