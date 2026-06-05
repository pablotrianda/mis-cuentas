import { describe, it, expect, beforeEach } from 'vitest'
import { db, generateId } from '../lib/db'
import { useExpenseStore } from './expenseStore'

beforeEach(async () => {
  await Promise.all(db.tables.map((t: any) => t.clear()))

  const now = new Date().toISOString()
  await db.expenseCategories.bulkAdd([
    { id: 'cat-a', name: 'Alquiler', icon: 'home', color: '#5B5FEF', isDefault: true, createdAt: now },
    { id: 'cat-b', name: 'Comida', icon: 'shopping-cart', color: '#2BB673', isDefault: true, createdAt: now },
  ])
  await db.creditCards.bulkAdd([
    { id: 'card-1', name: 'Visa', brand: 'Visa', bank: 'Galicia', color: '#6366F1', createdAt: now },
  ])

  useExpenseStore.setState({
    items: [],
    loading: false,
    error: null,
    month: '2026-06',
    typeFilter: null,
  })
})

describe('useExpenseStore', () => {
  it('starts with empty state', () => {
    const { items, loading, error } = useExpenseStore.getState()
    expect(items).toEqual([])
    expect(loading).toBe(false)
    expect(error).toBeNull()
  })

  it('adds a one-time expense', async () => {
    await useExpenseStore.getState().addOneTime({
      amount: 5000,
      description: 'Café',
      date: '2026-06-10',
      categoryId: 'cat-b',
      cardId: null,
    })

    const dbCount = await db.expenses.count()
    expect(dbCount).toBe(1)

    const { items, error } = useExpenseStore.getState()
    expect(error).toBeNull()
    expect(items.length).toBeGreaterThanOrEqual(1)
  })

  it('fetchAll returns real expenses', async () => {
    const now = new Date().toISOString()
    await db.expenses.add({
      id: generateId(), amount: 5000, description: 'Café', date: '2026-06-10',
      categoryId: 'cat-b', cardId: null, paymentType: 'ONE_TIME', createdAt: now,
    })

    await useExpenseStore.getState().fetchAll()
    const { items } = useExpenseStore.getState()
    expect(items.length).toBeGreaterThanOrEqual(1)
    const real = items.filter((i) => i.type === 'real')
    expect(real.length).toBeGreaterThanOrEqual(1)
  })

  it('fetchAll includes projected installments', async () => {
    const now = new Date().toISOString()
    await db.installmentPurchases.add({
      id: 'inst-1', description: 'Curso',
      totalAmount: 30000, installmentAmount: 10000,
      currentInstallment: 1, totalInstallments: 3,
      purchaseDate: '2026-06-01',
      categoryId: 'cat-b', cardId: 'card-1', status: 'ACTIVE', createdAt: now,
    })

    await useExpenseStore.getState().fetchAll()
    const { items } = useExpenseStore.getState()
    const installment = items.filter((i) => i.type === 'installment')
    expect(installment).toHaveLength(1)
    expect(installment[0]!.paymentType).toBe('INSTALLMENTS')
  })

  it('filter by paymentType works', async () => {
    const now = new Date().toISOString()
    await db.expenses.add({
      id: generateId(), amount: 5000, description: 'Café', date: '2026-06-10',
      categoryId: 'cat-b', cardId: null, paymentType: 'ONE_TIME', createdAt: now,
    })

    useExpenseStore.getState().setTypeFilter('ONE_TIME')
    await useExpenseStore.getState().fetchAll()
    const { items, typeFilter } = useExpenseStore.getState()
    expect(typeFilter).toBe('ONE_TIME')
    expect(items.every((i) => i.paymentType === 'ONE_TIME')).toBe(true)
  })

  it('removing a projected installment deactivates the purchase', async () => {
    const now = new Date().toISOString()
    await db.installmentPurchases.add({
      id: 'inst-1', description: 'Curso',
      totalAmount: 30000, installmentAmount: 10000,
      currentInstallment: 1, totalInstallments: 3,
      purchaseDate: '2026-06-01',
      categoryId: 'cat-b', cardId: 'card-1', status: 'ACTIVE', createdAt: now,
    })

    await useExpenseStore.getState().remove('proj-inst-inst-1-1')
    const purchase = await db.installmentPurchases.get('inst-1')
    expect(purchase?.status).toBe('FINISHED')
  })

  it('removing a projected recurring expense deactivates it', async () => {
    const now = new Date().toISOString()
    await db.recurringExpenses.add({
      id: 'rec-1', amount: 50000, description: 'Alquiler',
      categoryId: 'cat-a', startDate: '2026-01-01',
      active: true, createdAt: now,
    })
    const occId = 'occ-1'
    await db.recurringExpenseOccurrences.add({
      id: occId, recurringExpenseId: 'rec-1',
      year: 2026, month: 6, amount: 50000,
      dueDate: '2026-06-01', paid: false, createdAt: now,
    })

    await useExpenseStore.getState().remove(`proj-rec-${occId}`)
    const rec = await db.recurringExpenses.get('rec-1')
    expect(rec?.active).toBe(false)
  })
})
