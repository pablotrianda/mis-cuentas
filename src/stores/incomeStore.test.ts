import { describe, it, expect, beforeEach } from 'vitest'
import { db, generateId } from '../lib/db'
import { useIncomeStore } from './incomeStore'

beforeEach(async () => {
  await Promise.all(db.tables.map((t: any) => t.clear()))
  useIncomeStore.setState({ items: [], loading: false, error: null })
})

describe('useIncomeStore', () => {
  it('starts with empty state', () => {
    const { items, loading, error } = useIncomeStore.getState()
    expect(items).toEqual([])
    expect(loading).toBe(false)
    expect(error).toBeNull()
  })

  it('adds an income', async () => {
    await useIncomeStore.getState().add({
      amount: 100000,
      description: 'Sueldo',
      date: '2026-06-01',
    })

    const { items } = useIncomeStore.getState()
    expect(items).toHaveLength(1)
    expect(items[0]!.description).toBe('Sueldo')
    expect(items[0]!.amount).toBe(100000)
    expect(items[0]!.date).toBe('2026-06-01')
    expect(items[0]!.id).toBeDefined()
    expect(items[0]!.createdAt).toBeDefined()

    const dbCount = await db.incomes.count()
    expect(dbCount).toBe(1)
  })

  it('fetches all incomes for a month', async () => {
    const now = new Date().toISOString()
    await db.incomes.bulkAdd([
      { id: generateId(), amount: 100000, description: 'Junio', date: '2026-06-15', createdAt: now },
      { id: generateId(), amount: 50000, description: 'Julio', date: '2026-07-01', createdAt: now },
    ])

    await useIncomeStore.getState().fetchAll('2026-06')
    const { items } = useIncomeStore.getState()
    expect(items).toHaveLength(1)
    expect(items[0]!.description).toBe('Junio')
  })

  it('fetches all incomes when no month given', async () => {
    const now = new Date().toISOString()
    await db.incomes.bulkAdd([
      { id: generateId(), amount: 1000, description: 'A', date: '2026-01-01', createdAt: now },
      { id: generateId(), amount: 2000, description: 'B', date: '2026-02-01', createdAt: now },
    ])

    await useIncomeStore.getState().fetchAll()
    const { items } = useIncomeStore.getState()
    expect(items).toHaveLength(2)
  })

  it('removes an income', async () => {
    const now = new Date().toISOString()
    const id = generateId()
    await db.incomes.add({ id, amount: 50000, description: 'Extra', date: '2026-06-01', createdAt: now })
    useIncomeStore.setState({ items: [{ id, amount: 50000, description: 'Extra', date: '2026-06-01', createdAt: now }] })

    await useIncomeStore.getState().remove(id)
    const { items } = useIncomeStore.getState()
    expect(items).toHaveLength(0)

    const dbCount = await db.incomes.count()
    expect(dbCount).toBe(0)
  })

  it('sorts incomes by createdAt descending within month', async () => {
    const now1 = '2026-06-01T10:00:00.000Z'
    const now2 = '2026-06-01T12:00:00.000Z'
    await db.incomes.bulkAdd([
      { id: generateId(), amount: 100, description: 'Early', date: '2026-06-01', createdAt: now1 },
      { id: generateId(), amount: 200, description: 'Late', date: '2026-06-15', createdAt: now2 },
    ])

    await useIncomeStore.getState().fetchAll('2026-06')
    const { items } = useIncomeStore.getState()
    expect(items).toHaveLength(2)
    expect(items[0]!.description).toBe('Late')
    expect(items[1]!.description).toBe('Early')
  })
})
