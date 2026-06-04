import { describe, it, expect } from 'vitest'
import { centsToDisplay, displayToCents } from './AmountInput'

describe('centsToDisplay', () => {
  it('converts cents to locale-formatted display string', () => {
    const result = centsToDisplay(100000)
    expect(result).toContain('1.000')
    expect(result).toContain('00')
  })

  it('handles zero', () => {
    expect(centsToDisplay(0)).toContain('0')
  })

  it('handles small amounts', () => {
    expect(centsToDisplay(99)).toContain('0')
  })
})

describe('displayToCents', () => {
  it('converts simple number to cents', () => {
    expect(displayToCents('1000')).toBe(100000)
  })

  it('converts Argentine format (comma decimal)', () => {
    expect(displayToCents('1000,50')).toBe(100050)
  })

  it('converts Argentine format with thousands separator', () => {
    expect(displayToCents('1.000,00')).toBe(100000)
  })

  it('handles zero', () => {
    expect(displayToCents('0')).toBe(0)
  })

  it('handles empty string', () => {
    expect(displayToCents('')).toBe(NaN)
  })

  it('handles decimal without integer part', () => {
    const result = displayToCents(',50')
    expect(result).toBe(50)
  })

  it('treats dot as thousands separator (AR format)', () => {
    expect(displayToCents('1.234')).toBe(123400)
  })
})
