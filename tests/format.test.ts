import { describe, expect, it } from 'vitest'
import { formatNumber, formatPrice, formatSize } from '../src/utils/format'

describe('formatNumber', () => {
  it('inserts thousands separators', () => {
    expect(formatNumber(1234567)).toBe('1,234,567')
    expect(formatNumber(999)).toBe('999')
    expect(formatNumber(1000)).toBe('1,000')
  })

  it('keeps fixed decimals and groups the integer part', () => {
    expect(formatNumber(21699, 1)).toBe('21,699.0')
    expect(formatNumber(1234.5, 1)).toBe('1,234.5')
  })

  it('handles negatives', () => {
    expect(formatNumber(-12345)).toBe('-12,345')
  })
})

describe('formatPrice / formatSize', () => {
  it('formats price with one decimal', () => {
    expect(formatPrice(21657.5)).toBe('21,657.5')
    expect(formatPrice(21699)).toBe('21,699.0')
  })

  it('formats size as a grouped integer', () => {
    expect(formatSize(19836)).toBe('19,836')
    expect(formatSize(35)).toBe('35')
  })
})
