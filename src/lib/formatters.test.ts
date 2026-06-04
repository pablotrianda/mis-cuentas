import { describe, it, expect } from 'vitest'
import { formatARS, formatDate, formatMonth, centsToDecimal, decimalToCents } from './formatters'

describe('formatARS', () => {
  it('formats cents to ARS currency string', () => {
    const result = formatARS(100000)
    expect(result).toContain('1.000')
    expect(result).toContain('00')
  })

  it('handles zero', () => {
    expect(formatARS(0)).toContain('0')
  })

  it('handles negative values', () => {
    const result = formatARS(-5000)
    expect(result).toContain('50')
  })
})

describe('formatDate', () => {
  it('formats ISO date to es-AR short date', () => {
    const result = formatDate('2026-06-15')
    expect(result).toBeDefined()
    expect(result.length).toBeGreaterThan(0)
  })

  it('handles single-digit months and days', () => {
    const result = formatDate('2026-01-05')
    expect(result).toBeDefined()
  })
})

describe('formatMonth', () => {
  it('formats YYYY-MM to Spanish month name', () => {
    const result = formatMonth('2026-06')
    expect(result.toLowerCase()).toContain('junio')
    expect(result).toContain('2026')
  })

  it('formats January', () => {
    const result = formatMonth('2026-01')
    expect(result.toLowerCase()).toContain('enero')
  })

  it('formats December', () => {
    const result = formatMonth('2026-12')
    expect(result.toLowerCase()).toContain('diciembre')
  })
})

describe('centsToDecimal', () => {
  it('converts cents to decimal string', () => {
    expect(centsToDecimal(100000)).toBe('1000.00')
  })

  it('handles zero', () => {
    expect(centsToDecimal(0)).toBe('0.00')
  })

  it('handles single cent', () => {
    expect(centsToDecimal(1)).toBe('0.01')
  })
})

describe('decimalToCents', () => {
  it('converts decimal string to cents', () => {
    expect(decimalToCents('1000.00')).toBe(100000)
  })

  it('handles zero', () => {
    expect(decimalToCents('0')).toBe(0)
  })

  it('handles decimals with cents', () => {
    expect(decimalToCents('99.99')).toBe(9999)
  })
})
