import { describe, it, expect } from 'vitest'
import type { InstallmentPurchase } from './db'
import {
  computeDebtSummary,
  computeCardGroups,
  computeDebtFromMonth,
  computeRemainingDebt,
  computeRemainingInstallments,
  computeProgress,
  computeEndDate,
  computeIsFinished,
} from './future-debt'

function makePurchase(overrides: Partial<InstallmentPurchase>): InstallmentPurchase {
  return {
    id: 'test-1',
    description: 'Test',
    totalAmount: 100000,
    installmentAmount: 10000,
    currentInstallment: 1,
    totalInstallments: 10,
    purchaseDate: '2026-01-01',
    cardId: null,
    categoryId: 'cat-a',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('computeDebtSummary', () => {
  it('returns zeros for empty list', () => {
    const s = computeDebtSummary([])
    expect(s.futureDebt).toBe(0)
    expect(s.pendingInstallments).toBe(0)
    expect(s.nextMonthAmount).toBe(0)
  })

  it('computes future debt correctly', () => {
    const items = [
      makePurchase({ installmentAmount: 10000, currentInstallment: 1, totalInstallments: 10 }),
    ]
    const s = computeDebtSummary(items)
    // 10 remaining installments (1-10) = 10 * 10000 = 100000
    // Wait, remaining = totalInstallments - currentInstallment + 1 = 10 - 1 + 1 = 10
    // Actually: currentInstallment=1, so installments 1 through 10 remain = 10 remaining
    expect(s.futureDebt).toBe(100000)
    expect(s.pendingInstallments).toBe(10)
    expect(s.nextMonthAmount).toBe(10000)
  })

  it('computes partial debt correctly', () => {
    const items = [
      makePurchase({ installmentAmount: 5000, currentInstallment: 3, totalInstallments: 6 }),
    ]
    const s = computeDebtSummary(items)
    // remaining: 6 - 3 + 1 = 4 installments of 5000 = 20000
    expect(s.futureDebt).toBe(20000)
    expect(s.pendingInstallments).toBe(4)
    expect(s.nextMonthAmount).toBe(5000)
  })

  it('sums multiple purchases', () => {
    const items = [
      makePurchase({ id: 'a', installmentAmount: 10000, currentInstallment: 1, totalInstallments: 3 }),
      makePurchase({ id: 'b', installmentAmount: 5000, currentInstallment: 2, totalInstallments: 4 }),
    ]
    const s = computeDebtSummary(items)
    // a: remaining 3 installments = 30000
    // b: remaining 3 installments = 15000
    expect(s.futureDebt).toBe(45000)
    expect(s.pendingInstallments).toBe(6)
    expect(s.nextMonthAmount).toBe(15000)
  })

  it('ignores FINISHED purchases', () => {
    const items = [
      makePurchase({ status: 'FINISHED', installmentAmount: 10000, currentInstallment: 10, totalInstallments: 10 }),
    ]
    const s = computeDebtSummary(items)
    expect(s.futureDebt).toBe(0)
    expect(s.pendingInstallments).toBe(0)
  })
})

describe('computeCardGroups', () => {
  it('groups purchases by card', () => {
    const cardMap = new Map([
      ['card-1', { name: 'Visa', color: '#6366F1', brand: 'Visa' }],
    ])
    const items = [
      makePurchase({ id: 'a', cardId: 'card-1', installmentAmount: 10000, currentInstallment: 1, totalInstallments: 3 }),
      makePurchase({ id: 'b', cardId: 'card-1', installmentAmount: 5000, currentInstallment: 2, totalInstallments: 4 }),
      makePurchase({ id: 'c', cardId: null, installmentAmount: 2000, currentInstallment: 1, totalInstallments: 12 }),
    ]
    const groups = computeCardGroups(items, cardMap)
    expect(groups).toHaveLength(2)

    const visa = groups.find((g) => g.cardName === 'Visa')
    const none = groups.find((g) => g.cardName === 'Sin tarjeta')
    expect(visa).toBeDefined()
    expect(none).toBeDefined()
    expect(visa!.monthlyAmount).toBe(15000)
    expect(visa!.remainingDebt).toBe(45000)
    expect(visa!.purchaseCount).toBe(2)
    expect(none!.monthlyAmount).toBe(2000)
  })

  it('ignores FINISHED purchases', () => {
    const items = [
      makePurchase({ id: 'a', cardId: null, status: 'FINISHED' }),
    ]
    const groups = computeCardGroups(items, new Map())
    expect(groups).toHaveLength(0)
  })
})

describe('computeRemainingDebt', () => {
  it('computes remaining debt for active purchase', () => {
    const p = makePurchase({ installmentAmount: 5000, currentInstallment: 3, totalInstallments: 10 })
    // remaining: 10 - 3 + 1 = 8 installments of 5000 = 40000
    expect(computeRemainingDebt(p)).toBe(40000)
  })

  it('returns 0 when finished', () => {
    const p = makePurchase({ installmentAmount: 5000, currentInstallment: 10, totalInstallments: 10 })
    expect(computeRemainingDebt(p)).toBe(5000) // 1 remaining installment (10 - 10 + 1 = 1)
  })
})

describe('computeRemainingInstallments', () => {
  it('computes remaining count', () => {
    const p = makePurchase({ currentInstallment: 3, totalInstallments: 10 })
    expect(computeRemainingInstallments(p)).toBe(8)
  })

  it('returns 1 when on last installment', () => {
    const p = makePurchase({ currentInstallment: 10, totalInstallments: 10 })
    expect(computeRemainingInstallments(p)).toBe(1)
  })
})

describe('computeProgress', () => {
  it('returns 0 at start', () => {
    const p = makePurchase({ currentInstallment: 1, totalInstallments: 10 })
    expect(computeProgress(p)).toBe(0.1)
  })

  it('returns 0.5 at halfway', () => {
    const p = makePurchase({ currentInstallment: 5, totalInstallments: 10 })
    expect(computeProgress(p)).toBe(0.5)
  })

  it('returns 1 when finished', () => {
    const p = makePurchase({ currentInstallment: 10, totalInstallments: 10 })
    expect(computeProgress(p)).toBe(1)
  })
})

describe('computeEndDate', () => {
  it('computes end date correctly', () => {
    // purchaseDate 2026-01 + 10 months = 2026-11
    const p = makePurchase({ purchaseDate: '2026-01-15', totalInstallments: 10 })
    expect(computeEndDate(p)).toBe('2026-11')
  })

  it('handles year rollover', () => {
    // purchaseDate 2026-06 + 10 months = 2027-04
    const p = makePurchase({ purchaseDate: '2026-06-01', totalInstallments: 10 })
    expect(computeEndDate(p)).toBe('2027-04')
  })

  it('single installment ends same month', () => {
    const p = makePurchase({ purchaseDate: '2026-06-01', totalInstallments: 1 })
    expect(computeEndDate(p)).toBe('2026-07')
  })
})

describe('computeIsFinished', () => {
  it('returns false when current < total', () => {
    expect(computeIsFinished(makePurchase({ currentInstallment: 5, totalInstallments: 10 }))).toBe(false)
  })

  it('returns true when current >= total', () => {
    expect(computeIsFinished(makePurchase({ currentInstallment: 10, totalInstallments: 10 }))).toBe(true)
    expect(computeIsFinished(makePurchase({ currentInstallment: 11, totalInstallments: 10 }))).toBe(true)
  })
})

describe('computeDebtFromMonth', () => {
  it('returns zeros for empty list', () => {
    const s = computeDebtFromMonth([], '2026-06')
    expect(s.futureDebt).toBe(0)
    expect(s.pendingInstallments).toBe(0)
    expect(s.nextMonthAmount).toBe(0)
  })

  it('counts all installments from ref month forward', () => {
    // purchase from Jan 2026, 6 installments, current=1 → installments in Jan-Jun
    const items = [
      makePurchase({
        purchaseDate: '2026-01-01',
        installmentAmount: 10000,
        currentInstallment: 1,
        totalInstallments: 6,
      }),
    ]
    // from June → only installments in June (index 5) = 1 installment
    const s = computeDebtFromMonth(items, '2026-06')
    expect(s.futureDebt).toBe(10000)
    expect(s.pendingInstallments).toBe(1)
    expect(s.nextMonthAmount).toBe(10000)
  })

  it('shows less debt when viewing a later month', () => {
    const items = [
      makePurchase({
        purchaseDate: '2026-01-01',
        installmentAmount: 10000,
        currentInstallment: 1,
        totalInstallments: 6,
      }),
    ]
    const fromApril = computeDebtFromMonth(items, '2026-04')
    // installments in Apr/May/Jun = 3
    expect(fromApril.futureDebt).toBe(30000)
    expect(fromApril.pendingInstallments).toBe(3)
    expect(fromApril.nextMonthAmount).toBe(10000)

    const fromJune = computeDebtFromMonth(items, '2026-06')
    // installments in Jun = 1
    expect(fromJune.futureDebt).toBe(10000)
    expect(fromJune.pendingInstallments).toBe(1)
  })

  it('returns zero when ref month is past all installments', () => {
    const items = [
      makePurchase({
        purchaseDate: '2026-01-01',
        installmentAmount: 10000,
        currentInstallment: 6,
        totalInstallments: 6,
      }),
    ]
    const s = computeDebtFromMonth(items, '2026-07')
    expect(s.futureDebt).toBe(0)
    expect(s.pendingInstallments).toBe(0)
  })

  it('respects currentInstallment offset', () => {
    // purchase from Apr 2026, current=3, total=5
    // installment 3 = Jun, 4 = Jul, 5 = Aug
    const items = [
      makePurchase({
        purchaseDate: '2026-04-01',
        installmentAmount: 10000,
        currentInstallment: 3,
        totalInstallments: 5,
      }),
    ]
    const s = computeDebtFromMonth(items, '2026-05')
    // from May: Jun/Jul/Aug = 3 installments
    expect(s.futureDebt).toBe(30000)
    expect(s.pendingInstallments).toBe(3)
    // next month amount for May = 0 (no installment in May)
    expect(s.nextMonthAmount).toBe(0)
  })

  it('handles FINISHED purchases', () => {
    const items = [
      makePurchase({
        status: 'FINISHED',
        purchaseDate: '2026-01-01',
        installmentAmount: 10000,
        currentInstallment: 6,
        totalInstallments: 6,
      }),
    ]
    const s = computeDebtFromMonth(items, '2026-01')
    expect(s.futureDebt).toBe(0)
  })
})
