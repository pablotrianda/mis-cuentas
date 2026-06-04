import { describe, it, expect, beforeEach } from 'vitest'
import { db, generateId } from './db'
import { getProjectedExpenses } from './projections'

beforeEach(async () => {
  await Promise.all(db.tables.map((t: any) => t.clear()))
})

async function seedDefaults() {
  const now = new Date().toISOString()
  await db.expenseCategories.bulkAdd([
    { id: 'cat-a', name: 'Alquiler', icon: 'home', color: '#5B5FEF', isDefault: true, createdAt: now },
    { id: 'cat-b', name: 'Comida', icon: 'shopping-cart', color: '#2BB673', isDefault: true, createdAt: now },
    { id: 'cat-c', name: 'Otros', icon: 'more-horizontal', color: '#7B8190', isDefault: true, createdAt: now },
  ])
  await db.creditCards.bulkAdd([
    { id: 'card-1', name: 'Visa', brand: 'Visa', bank: 'Galicia', color: '#6366F1', createdAt: now },
  ])
}

describe('getProjectedExpenses', () => {
  it('returns empty array for empty DB', async () => {
    const items = await getProjectedExpenses('2026-06')
    expect(items).toEqual([])
  })

  it('returns real expenses for the given month', async () => {
    await seedDefaults()
    const now = new Date().toISOString()
    await db.expenses.add({
      id: generateId(), amount: 5000, description: 'Café', date: '2026-06-10',
      categoryId: 'cat-b', cardId: null, paymentType: 'ONE_TIME', createdAt: now,
    })
    await db.expenses.add({
      id: generateId(), amount: 10000, description: 'Almuerzo', date: '2026-06-11',
      categoryId: 'cat-b', cardId: null, paymentType: 'ONE_TIME', createdAt: now,
    })

    const items = await getProjectedExpenses('2026-06')
    expect(items).toHaveLength(2)
    expect(items.every((i) => i.type === 'real')).toBe(true)
  })

  it('only returns real expenses for the requested month', async () => {
    await seedDefaults()
    const now = new Date().toISOString()
    await db.expenses.bulkAdd([
      { id: generateId(), amount: 5000, description: 'Junio', date: '2026-06-10',
        categoryId: 'cat-b', cardId: null, paymentType: 'ONE_TIME', createdAt: now },
      { id: generateId(), amount: 6000, description: 'Julio', date: '2026-07-10',
        categoryId: 'cat-b', cardId: null, paymentType: 'ONE_TIME', createdAt: now },
    ])

    const items = await getProjectedExpenses('2026-06')
    expect(items).toHaveLength(1)
    expect(items[0]!.description).toBe('Junio')
  })

  it('projects installments for the correct month', async () => {
    await seedDefaults()
    const now = new Date().toISOString()
    await db.installmentPurchases.add({
      id: 'inst-1', description: 'Laptop',
      totalAmount: 120000, installmentAmount: 40000,
      currentInstallment: 1, totalInstallments: 3,
      purchaseDate: '2026-06-01',
      categoryId: 'cat-c', cardId: 'card-1', status: 'ACTIVE', createdAt: now,
    })

    const items = await getProjectedExpenses('2026-06')
    expect(items).toHaveLength(1)
    expect(items[0]!.paymentType).toBe('INSTALLMENTS')
    expect(items[0]!.amount).toBe(40000)
    expect(items[0]!.description).toContain('Laptop')
    expect(items[0]!.installmentNumber).toBe(1)
    expect(items[0]!.totalInstallments).toBe(3)
    expect(items[0]!.id).toMatch(/^proj-inst-/)
  })

  it('does not project installments for FINISHED purchases', async () => {
    await seedDefaults()
    const now = new Date().toISOString()
    await db.installmentPurchases.add({
      id: 'inst-1', description: 'Laptop',
      totalAmount: 120000, installmentAmount: 40000,
      currentInstallment: 1, totalInstallments: 3,
      purchaseDate: '2026-06-01',
      categoryId: 'cat-c', cardId: 'card-1', status: 'FINISHED', createdAt: now,
    })

    const items = await getProjectedExpenses('2026-06')
    expect(items).toHaveLength(0)
  })

  it('projects multiple installments across months', async () => {
    await seedDefaults()
    const now = new Date().toISOString()
    await db.installmentPurchases.add({
      id: 'inst-1', description: 'Curso',
      totalAmount: 30000, installmentAmount: 10000,
      currentInstallment: 1, totalInstallments: 3,
      purchaseDate: '2026-06-01',
      categoryId: 'cat-c', cardId: 'card-1', status: 'ACTIVE', createdAt: now,
    })

    const june = await getProjectedExpenses('2026-06')
    expect(june).toHaveLength(1)
    expect(june[0]!.amount).toBe(10000)
    expect(june[0]!.installmentNumber).toBe(1)

    const july = await getProjectedExpenses('2026-07')
    expect(july).toHaveLength(1)
    expect(july[0]!.amount).toBe(10000)
    expect(july[0]!.installmentNumber).toBe(2)

    const august = await getProjectedExpenses('2026-08')
    expect(august).toHaveLength(1)
    expect(august[0]!.amount).toBe(10000)
    expect(august[0]!.installmentNumber).toBe(3)

    const september = await getProjectedExpenses('2026-09')
    expect(september).toHaveLength(0)
  })

  it('projects currentInstallment offset correctly', async () => {
    await seedDefaults()
    const now = new Date().toISOString()
    await db.installmentPurchases.add({
      id: 'inst-1', description: 'Curso diferido',
      totalAmount: 50000, installmentAmount: 10000,
      currentInstallment: 3, totalInstallments: 5,
      purchaseDate: '2026-04-01',
      categoryId: 'cat-c', cardId: null, status: 'ACTIVE', createdAt: now,
    })

    const june = await getProjectedExpenses('2026-06')
    expect(june).toHaveLength(1)
    expect(june[0]!.installmentNumber).toBe(3)

    const july = await getProjectedExpenses('2026-07')
    expect(july).toHaveLength(1)
    expect(july[0]!.installmentNumber).toBe(4)

    const august = await getProjectedExpenses('2026-08')
    expect(august).toHaveLength(1)
    expect(august[0]!.installmentNumber).toBe(5)

    const september = await getProjectedExpenses('2026-09')
    expect(september).toHaveLength(0)
  })

  it('projects active recurring expenses', async () => {
    await seedDefaults()
    const now = new Date().toISOString()
    await db.recurringExpenses.add({
      id: 'rec-1', amount: 50000, description: 'Alquiler',
      categoryId: 'cat-a', startDate: '2026-01-01',
      active: true, createdAt: now,
    })

    const items = await getProjectedExpenses('2026-06')
    expect(items).toHaveLength(1)
    expect(items[0]!.paymentType).toBe('RECURRING')
    expect(items[0]!.amount).toBe(50000)
    expect(items[0]!.description).toBe('Alquiler')
    expect(items[0]!.id).toMatch(/^proj-rec-/)
  })

  it('does not project recurring expense that has not started yet', async () => {
    await seedDefaults()
    const now = new Date().toISOString()
    await db.recurringExpenses.add({
      id: 'rec-1', amount: 50000, description: 'Seguro',
      categoryId: 'cat-a', startDate: '2026-07-01',
      active: true, createdAt: now,
    })

    const items = await getProjectedExpenses('2026-06')
    expect(items).toHaveLength(0)
  })

  it('does not project inactive recurring expenses', async () => {
    await seedDefaults()
    const now = new Date().toISOString()
    await db.recurringExpenses.add({
      id: 'rec-1', amount: 50000, description: 'Alquiler',
      categoryId: 'cat-a', startDate: '2026-01-01',
      active: false, createdAt: now,
    })

    const items = await getProjectedExpenses('2026-06')
    expect(items).toHaveLength(0)
  })

  it('merges real expenses, installments, and recurring expenses', async () => {
    await seedDefaults()
    const now = new Date().toISOString()
    await db.expenses.add({
      id: generateId(), amount: 5000, description: 'Café', date: '2026-06-10',
      categoryId: 'cat-b', cardId: null, paymentType: 'ONE_TIME', createdAt: now,
    })
    await db.installmentPurchases.add({
      id: 'inst-1', description: 'Curso',
      totalAmount: 30000, installmentAmount: 10000,
      currentInstallment: 1, totalInstallments: 3,
      purchaseDate: '2026-06-01',
      categoryId: 'cat-c', cardId: 'card-1', status: 'ACTIVE', createdAt: now,
    })
    await db.recurringExpenses.add({
      id: 'rec-1', amount: 50000, description: 'Alquiler',
      categoryId: 'cat-a', startDate: '2026-01-01',
      active: true, createdAt: now,
    })

    const items = await getProjectedExpenses('2026-06')
    expect(items).toHaveLength(3)

    const types = items.map((i) => i.type).sort()
    expect(types).toEqual(['installment', 'real', 'recurring'])
  })
})
