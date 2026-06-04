import { create } from 'zustand'
import { db, generateId, type RecurringExpense } from '../lib/db'
import type { CreateRecurringExpense, UpdateRecurringExpense } from '../lib/shared-types'

interface RecurringExpenseState {
  items: RecurringExpense[]
  loading: boolean
  error: string | null
  fetchAll: () => Promise<void>
  add: (data: CreateRecurringExpense) => Promise<void>
  update: (id: string, data: UpdateRecurringExpense) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const useRecurringExpenseStore = create<RecurringExpenseState>((set) => ({
  items: [],
  loading: false,
  error: null,
  fetchAll: async () => {
    set({ loading: true, error: null })
    try {
      const items = await db.recurringExpenses
        .orderBy('createdAt')
        .reverse()
        .toArray()
      set({ items, loading: false })
    } catch (e) {
      set({ error: (e as Error).message, loading: false })
    }
  },
  add: async (data) => {
    const now = new Date().toISOString()
    const item: RecurringExpense = {
      id: generateId(),
      description: data.description,
      amount: data.amount,
      categoryId: data.categoryId,
      startDate: data.startDate,
      active: true,
      createdAt: now,
    }
    try {
      await db.recurringExpenses.add(item)
      set((s) => ({ items: [item, ...s.items] }))
    } catch (e) {
      set({ error: (e as Error).message })
    }
  },
  update: async (id, data) => {
    try {
      await db.recurringExpenses.update(id, data)
      set((s) => ({
        items: s.items.map((i) => (i.id === id ? { ...i, ...data } : i)),
      }))
    } catch (e) {
      set({ error: (e as Error).message })
    }
  },
  remove: async (id) => {
    try {
      await db.recurringExpenses.delete(id)
      set((s) => ({ items: s.items.filter((i) => i.id !== id) }))
    } catch (e) {
      set({ error: (e as Error).message })
    }
  },
}))
