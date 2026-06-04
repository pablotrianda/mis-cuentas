import { create } from 'zustand'
import { db, generateId, type Income } from '../lib/db'
import type { CreateIncome } from '../lib/shared-types'

interface IncomeState {
  items: Income[]
  loading: boolean
  error: string | null
  fetchAll: (month?: string) => Promise<void>
  add: (data: CreateIncome) => Promise<void>
  update: (id: string, data: Partial<Income>) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const useIncomeStore = create<IncomeState>((set) => ({
  items: [],
  loading: false,
  error: null,
  fetchAll: async (month) => {
    set({ loading: true, error: null })
    try {
      let items: Income[]
      if (month) {
        items = await db.incomes
          .where('date')
          .startsWith(month)
          .sortBy('createdAt')
        items.reverse()
      } else {
        items = await db.incomes
          .orderBy('createdAt')
          .reverse()
          .toArray()
      }
      set({ items, loading: false })
    } catch (e) {
      set({ error: (e as Error).message, loading: false })
    }
  },
  add: async (data) => {
    const now = new Date().toISOString()
    const item: Income = { ...data, id: generateId(), createdAt: now }
    await db.incomes.add(item)
    set((s) => ({ items: [item, ...s.items] }))
  },
  update: async (id, data) => {
    try {
      await db.incomes.update(id, data)
      set((s) => ({
        items: s.items.map((i) => (i.id === id ? { ...i, ...data } : i)),
      }))
    } catch (e) {
      set({ error: (e as Error).message })
    }
  },
  remove: async (id) => {
    try {
      await db.incomes.delete(id)
      set((s) => ({ items: s.items.filter((i) => i.id !== id) }))
    } catch (e) {
      set({ error: (e as Error).message })
    }
  },
}))
