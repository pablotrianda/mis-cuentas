import { create } from 'zustand'
import { db, generateId, type InstallmentPurchase } from '../lib/db'
import type { CreateInstallmentPurchase, UpdateInstallmentPurchase } from '../lib/shared-types'

interface InstallmentState {
  items: InstallmentPurchase[]
  loading: boolean
  error: string | null
  fetchAll: () => Promise<void>
  add: (data: CreateInstallmentPurchase) => Promise<void>
  update: (id: string, data: UpdateInstallmentPurchase) => Promise<void>
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
      description: data.description,
      totalAmount: data.totalAmount,
      installmentAmount: data.installmentAmount,
      currentInstallment: data.currentInstallment,
      totalInstallments: data.totalInstallments,
      purchaseDate: data.purchaseDate,
      cardId: data.cardId ?? null,
      categoryId: data.categoryId,
      status: 'ACTIVE',
      createdAt: now,
    }
    try {
      await db.installmentPurchases.add(item)
      set((s) => ({ items: [item, ...s.items] }))
    } catch (e) {
      set({ error: (e as Error).message })
    }
  },
  update: async (id, data) => {
    try {
      await db.installmentPurchases.update(id, data)
      set((s) => ({
        items: s.items.map((i) => (i.id === id ? { ...i, ...data } as InstallmentPurchase : i)),
      }))
    } catch (e) {
      set({ error: (e as Error).message })
    }
  },
  remove: async (id) => {
    try {
      await db.installmentPurchases.update(id, { status: 'FINISHED' })
      set((s) => ({
        items: s.items.map((i) => (i.id === id ? { ...i, status: 'FINISHED' } : i)),
      }))
    } catch (e) {
      set({ error: (e as Error).message })
    }
  },
}))
