import { describe, it, expect, beforeEach } from 'vitest'
import { db, generateId } from './db'
import { getDashboardData } from './dashboard'

beforeEach(async () => {
  await Promise.all(db.tables.map((t: any) => t.clear()))
})

async function seedFullData() {
  const now = new Date().toISOString()
  await db.expenseCategories.bulkAdd([
    { id: 'cat-a', name: 'Alquiler', icon: 'home', color: '#5B5FEF', isDefault: true, createdAt: now },
    { id: 'cat-b', name: 'Comida', icon: 'shopping-cart', color: '#2BB673', isDefault: true, createdAt: now },
  ])
  await db.creditCards.bulkAdd([
    { id: 'card-1', name: 'Visa', brand: 'Visa', bank: 'Galicia', color: '#6366F1', createdAt: now },
    { id: 'card-2', name: 'Mastercard', brand: 'Mastercard', bank: 'BBVA', color: '#E05A5A', createdAt: now },
  ])
  await db.incomes.bulkAdd([
    { id: generateId(), amount: 200000, description: 'Sueldo', date: '2026-06-01', createdAt: now },
    { id: generateId(), amount: 50000, description: 'Freelance', date: '2026-06-15', createdAt: now },
  ])
  await db.expenses.bulkAdd([
    { id: generateId(), amount: 5000, description: 'Café', date: '2026-06-01',
      categoryId: 'cat-b', cardId: 'card-1', paymentType: 'ONE_TIME', createdAt: now },
    { id: generateId(), amount: 15000, description: 'Almuerzo', date: '2026-06-10',
      categoryId: 'cat-b', cardId: 'card-2', paymentType: 'ONE_TIME', createdAt: now },
    { id: generateId(), amount: 8000, description: 'Taxi', date: '2026-06-05',
      categoryId: 'cat-b', cardId: null, paymentType: 'ONE_TIME', createdAt: now },
  ])
  await db.installmentPurchases.add({
    id: 'inst-1', description: 'Laptop',
    totalAmount: 120000, installmentAmount: 40000,
    currentInstallment: 1, totalInstallments: 3,
    purchaseDate: '2026-06-01',
    categoryId: 'cat-b', cardId: 'card-1', status: 'ACTIVE', createdAt: now,
  })
  await db.recurringExpenses.add({
    id: 'rec-1', amount: 50000, description: 'Alquiler',
    categoryId: 'cat-a', startDate: '2026-01-01',
    active: true, createdAt: now,
  })
}

describe('getDashboardData', () => {
  it('returns zeros for empty DB', async () => {
    const data = await getDashboardData('2026-06')
    expect(data.totalIncomes).toBe(0)
    expect(data.totalExpenses).toBe(0)
    expect(data.balance).toBe(0)
    expect(data.totalByPaymentType.ONE_TIME).toBe(0)
    expect(data.totalByPaymentType.INSTALLMENTS).toBe(0)
    expect(data.totalByPaymentType.RECURRING).toBe(0)
    expect(data.perCardSpending).toEqual([])
    expect(data.categoryBreakdown).toEqual([])
    expect(data.recentTransactions).toEqual([])
  })

  it('computes totals correctly', async () => {
    await seedFullData()
    const data = await getDashboardData('2026-06')

    expect(data.totalIncomes).toBe(250000)
    expect(data.totalExpenses).toBe(118000)
    expect(data.balance).toBe(132000)
  })

  it('computes payment type breakdown', async () => {
    await seedFullData()
    const data = await getDashboardData('2026-06')

    expect(data.totalByPaymentType.ONE_TIME).toBe(28000)
    expect(data.totalByPaymentType.INSTALLMENTS).toBe(40000)
    expect(data.totalByPaymentType.RECURRING).toBe(50000)
  })

  it('computes per-card spending', async () => {
    await seedFullData()
    const data = await getDashboardData('2026-06')

    expect(data.perCardSpending).toHaveLength(2)
    const visa = data.perCardSpending.find((c) => c.cardName === 'Visa')
    const mc = data.perCardSpending.find((c) => c.cardName === 'Mastercard')
    expect(visa).toBeDefined()
    expect(mc).toBeDefined()
    expect(visa!.amount).toBe(45000)
    expect(mc!.amount).toBe(15000)
  })

  it('computes category breakdown', async () => {
    await seedFullData()
    const data = await getDashboardData('2026-06')

    const alquiler = data.categoryBreakdown.find((c) => c.categoryName === 'Alquiler')
    const comida = data.categoryBreakdown.find((c) => c.categoryName === 'Comida')
    expect(alquiler).toBeDefined()
    expect(comida).toBeDefined()

    expect(alquiler!.amount).toBe(50000)
    expect(comida!.amount).toBe(68000)

    const totalPct = data.categoryBreakdown.reduce((s, c) => s + c.percentage, 0)
    expect(totalPct).toBeCloseTo(100, 0)
  })

  it('returns recent transactions (max 5)', async () => {
    await seedFullData()
    const data = await getDashboardData('2026-06')

    expect(data.recentTransactions.length).toBeLessThanOrEqual(5)
    expect(data.recentTransactions[0]).toHaveProperty('id')
    expect(data.recentTransactions[0]).toHaveProperty('amount')
    expect(data.recentTransactions[0]).toHaveProperty('description')
  })

  it('recent transactions are sorted by date descending', async () => {
    await seedFullData()
    const data = await getDashboardData('2026-06')

    for (let i = 1; i < data.recentTransactions.length; i++) {
      expect(
        data.recentTransactions[i - 1]!.date >= data.recentTransactions[i]!.date,
      ).toBe(true)
    }
  })
})
