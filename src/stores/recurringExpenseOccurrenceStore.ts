import { create } from 'zustand'
import { db, generateId, type RecurringExpenseOccurrence } from '../lib/db'
import type { MonthlyRecurringSummary, RecurringOccurrenceWithDescription } from '../lib/shared-types'

interface OccurrenceState {
  summary: MonthlyRecurringSummary | null
  loading: boolean
  error: string | null
  fetchMonth: (year: number, month: number) => Promise<void>
  generateMonth: (year: number, month: number) => Promise<void>
  markPaid: (id: string) => Promise<void>
  unmarkPaid: (id: string) => Promise<void>
  updateAmount: (id: string, amount: number) => Promise<void>
}

function getDueDate(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}-01`
}

export const useRecurringExpenseOccurrenceStore = create<OccurrenceState>((set, get) => ({
  summary: null,
  loading: false,
  error: null,

  fetchMonth: async (year, month) => {
    set({ loading: true, error: null })
    try {
      await get().generateMonth(year, month)

      const occurrences = await db.recurringExpenseOccurrences
        .where('[year+month]')
        .equals([year, month])
        .reverse()
        .sortBy('createdAt')

      const allRecurring = await db.recurringExpenses.toArray()
      const recMap = new Map(allRecurring.map((r) => [r.id, r]))

      const items: RecurringOccurrenceWithDescription[] = occurrences.map((o) => {
        const rec = recMap.get(o.recurringExpenseId)
        return { ...o, description: rec?.description ?? '' }
      })

      const pending = items.filter((i) => !i.paid).reduce((s, i) => s + i.amount, 0)
      const paid = items.filter((i) => i.paid).reduce((s, i) => s + i.amount, 0)
      const total = pending + paid

      set({
        summary: { pending, paid, total, items },
        loading: false,
      })
    } catch (e) {
      set({ error: (e as Error).message, loading: false })
    }
  },

  generateMonth: async (year, month) => {
    const active = await db.recurringExpenses
      .where('active')
      .equals(1)
      .toArray()

    const existing = await db.recurringExpenseOccurrences
      .where('[year+month]')
      .equals([year, month])
      .toArray()
    const existingIds = new Set(existing.map((o) => o.recurringExpenseId))

    const now = new Date()
    const targetStart = new Date(year, month - 1, 1)
    const targetEnd = new Date(year, month, 0)

    for (const rec of active) {
      if (existingIds.has(rec.id)) continue
      if (rec.endDate && new Date(rec.endDate) < targetStart) continue

      const startDate = new Date(rec.startDate)
      if (startDate > targetEnd) continue

      const occurrence: RecurringExpenseOccurrence = {
        id: generateId(),
        recurringExpenseId: rec.id,
        year,
        month,
        amount: rec.amount,
        dueDate: getDueDate(year, month),
        paid: false,
        createdAt: now.toISOString(),
      }
      await db.recurringExpenseOccurrences.add(occurrence)
    }
  },

  markPaid: async (id) => {
    try {
      const now = new Date().toISOString()
      await db.recurringExpenseOccurrences.update(id, { paid: true, paidAt: now })
      const s = get().summary
      if (s) {
        const items = s.items.map((i) =>
          i.id === id ? { ...i, paid: true, paidAt: now } : i,
        )
        const pending = items.filter((i) => !i.paid).reduce((sum, i) => sum + i.amount, 0)
        const paid = items.filter((i) => i.paid).reduce((sum, i) => sum + i.amount, 0)
        set({ summary: { ...s, pending, paid, total: pending + paid, items } })
      }
    } catch (e) {
      set({ error: (e as Error).message })
    }
  },

  unmarkPaid: async (id) => {
    try {
      await db.recurringExpenseOccurrences.update(id, { paid: false, paidAt: undefined })
      const s = get().summary
      if (s) {
        const items = s.items.map((i) =>
          i.id === id ? { ...i, paid: false, paidAt: undefined } : i,
        )
        const pending = items.filter((i) => !i.paid).reduce((sum, i) => sum + i.amount, 0)
        const paid = items.filter((i) => i.paid).reduce((sum, i) => sum + i.amount, 0)
        set({ summary: { ...s, pending, paid, total: pending + paid, items } })
      }
    } catch (e) {
      set({ error: (e as Error).message })
    }
  },

  updateAmount: async (id, amount) => {
    try {
      await db.recurringExpenseOccurrences.update(id, { amount })
      const s = get().summary
      if (s) {
        const items = s.items.map((i) =>
          i.id === id ? { ...i, amount } : i,
        )
        const pending = items.filter((i) => !i.paid).reduce((sum, i) => sum + i.amount, 0)
        const paid = items.filter((i) => i.paid).reduce((sum, i) => sum + i.amount, 0)
        set({ summary: { ...s, pending, paid, total: pending + paid, items } })
      }
    } catch (e) {
      set({ error: (e as Error).message })
    }
  },
}))