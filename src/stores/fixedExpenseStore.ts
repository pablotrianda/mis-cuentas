import { create } from 'zustand'
import { db, generateId, type FixedExpense } from '../lib/db'
import type { CreateFixedExpense, UpdateFixedExpense } from '../lib/shared-types'

interface FixedExpenseState {
  items: FixedExpense[]
  loading: boolean
  error: string | null
  fetchAll: () => Promise<void>
  add: (data: CreateFixedExpense) => Promise<void>
  update: (id: string, data: UpdateFixedExpense) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const useFixedExpenseStore = create<FixedExpenseState>((set) => ({
  items: [],
  loading: false,
  error: null,
  fetchAll: async () => {
    set({ loading: true, error: null })
    try {
      const items = await db.fixedExpenses
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
    const item: FixedExpense = {
      id: generateId(),
      amount: data.amount,
      description: data.description,
      categoryId: data.categoryId,
      cardId: data.cardId ?? null,
      startDate: data.startDate,
      isActive: true,
      createdAt: now,
    }
    try {
      await db.fixedExpenses.add(item)
      set((s) => ({ items: [item, ...s.items] }))
    } catch (e) {
      set({ error: (e as Error).message })
    }
  },
  update: async (id, data) => {
    try {
      await db.fixedExpenses.update(id, data)
      set((s) => ({
        items: s.items.map((i) => (i.id === id ? { ...i, ...data } : i)),
      }))
    } catch (e) {
      set({ error: (e as Error).message })
    }
  },
  remove: async (id) => {
    try {
      await db.fixedExpenses.delete(id)
      set((s) => ({ items: s.items.filter((i) => i.id !== id) }))
    } catch (e) {
      set({ error: (e as Error).message })
    }
  },
}))
