import { create } from 'zustand'
import type { DashboardData } from '@miscuentas/shared'
import { getDashboardData } from '../lib/dashboard'

interface DashboardState {
  data: DashboardData | null
  loading: boolean
  error: string | null
  fetchAll: (month: string) => Promise<void>
}

export const useDashboardStore = create<DashboardState>((set) => ({
  data: null,
  loading: false,
  error: null,
  fetchAll: async (month) => {
    set({ loading: true, error: null })
    try {
      const data = await getDashboardData(month)
      set({ data, loading: false })
    } catch (e) {
      set({ error: (e as Error).message, loading: false })
    }
  },
}))
