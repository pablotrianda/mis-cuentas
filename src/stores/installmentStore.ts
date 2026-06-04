import { create } from 'zustand'
import { db, generateId, type InstallmentPurchase } from '../lib/db'
import type { CreateInstallmentPurchase } from '@miscuentas/shared'

interface InstallmentState {
  items: InstallmentPurchase[]
  loading: boolean
  error: string | null
  fetchAll: () => Promise<void>
  add: (data: CreateInstallmentPurchase) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const useInstallmentStore = create<InstallmentState>((set) => ({
  items: [],
  loading: false,
  error: null,
  fetchAll: async () => {
    set({ loading: true, error: null })
    try {
      const items = await db.installmentPurchases
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
    const item: InstallmentPurchase = {
      id: generateId(),
      totalAmount: data.totalAmount,
      totalInstallments: data.totalInstallments,
      purchaseDate: data.purchaseDate,
      description: data.description,
      categoryId: data.categoryId,
      cardId: data.cardId,
      isActive: true,
      createdAt: now,
    }
    try {
      await db.installmentPurchases.add(item)
      set((s) => ({ items: [item, ...s.items] }))
    } catch (e) {
      set({ error: (e as Error).message })
    }
  },
  remove: async (id) => {
    try {
      await db.installmentPurchases.update(id, { isActive: false })
      set((s) => ({
        items: s.items.map((i) => (i.id === id ? { ...i, isActive: false } : i)),
      }))
    } catch (e) {
      set({ error: (e as Error).message })
    }
  },
}))
