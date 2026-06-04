import { describe, it, expect, beforeEach } from 'vitest'
import { db, generateId, ensureDefaultCategories } from './db'

beforeEach(async () => {
  await Promise.all(db.tables.map((t: any) => t.clear()))
})

describe('generateId', () => {
  it('returns a UUID string', () => {
    const id = generateId()
    expect(id).toBeDefined()
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(0)
  })

  it('returns unique values', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()))
    expect(ids.size).toBe(100)
  })
})

describe('db schema', () => {
  it('has all 6 tables', () => {
    const tableNames = db.tables.map((t: any) => t.name).sort()
    expect(tableNames).toEqual([
      'creditCards',
      'expenseCategories',
      'expenses',
      'fixedExpenses',
      'incomes',
      'installmentPurchases',
    ])
  })
})

describe('ensureDefaultCategories', () => {
  it('seeds 9 default categories on empty DB', async () => {
    const countBefore = await db.expenseCategories.count()
    expect(countBefore).toBe(0)

    await ensureDefaultCategories()

    const count = await db.expenseCategories.count()
    expect(count).toBe(9)
  })

  it('does not duplicate categories if already seeded', async () => {
    await ensureDefaultCategories()
    await ensureDefaultCategories()

    const count = await db.expenseCategories.count()
    expect(count).toBe(9)
  })

  it('creates categories with correct structure', async () => {
    await ensureDefaultCategories()
    const cat = await db.expenseCategories.get('cat-alquiler')
    expect(cat).toBeDefined()
    expect(cat!.name).toBe('Alquiler')
    expect(cat!.isDefault).toBe(true)
    expect(typeof cat!.createdAt).toBe('string')
  })
})

describe('incomes table', () => {
  it('stores and retrieves an income', async () => {
    const now = new Date().toISOString()
    await db.incomes.add({
      id: generateId(),
      amount: 100000,
      description: 'Sueldo',
      date: '2026-06-01',
      createdAt: now,
    })

    const count = await db.incomes.count()
    expect(count).toBe(1)
  })

  it('filters incomes by month', async () => {
    const now = new Date().toISOString()
    await db.incomes.bulkAdd([
      { id: generateId(), amount: 100000, description: 'Junio', date: '2026-06-15', createdAt: now },
      { id: generateId(), amount: 50000, description: 'Julio', date: '2026-07-01', createdAt: now },
    ])

    const juneItems = await db.incomes.where('date').startsWith('2026-06').toArray()
    expect(juneItems).toHaveLength(1)
    expect(juneItems[0]!.description).toBe('Junio')
  })
})

describe('expenses table', () => {
  it('stores and retrieves an expense', async () => {
    const now = new Date().toISOString()
    await db.expenses.add({
      id: generateId(),
      amount: 5000,
      description: 'Café',
      date: '2026-06-01',
      categoryId: 'cat-otros',
      cardId: null,
      paymentType: 'single',
      installmentPurchaseId: null,
      createdAt: now,
    })

    const count = await db.expenses.count()
    expect(count).toBe(1)
  })
})

describe('creditCards table', () => {
  it('stores and retrieves a card', async () => {
    const now = new Date().toISOString()
    await db.creditCards.add({
      id: generateId(),
      name: 'Visa Platinum',
      brand: 'Visa',
      bank: 'Galicia',
      color: '#6366F1',
      createdAt: now,
    })

    const card = await db.creditCards.get(generateId())
    expect(card).toBeUndefined()

    const cards = await db.creditCards.toArray()
    expect(cards).toHaveLength(1)
    expect(cards[0]!.name).toBe('Visa Platinum')
  })
})
