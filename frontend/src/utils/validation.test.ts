import { describe, expect, it } from 'vitest'
import { cleanCnpj, formatCnpj, validateCnpjChecksum, validateCnpjFormat } from './validation'

describe('cleanCnpj', () => {
  it('removes all non-digit characters', () => {
    expect(cleanCnpj('11.222.333/0001-81')).toBe('11222333000181')
    expect(cleanCnpj('12.345.678/0001-95')).toBe('12345678000195')
  })

  it('handles already clean input', () => {
    expect(cleanCnpj('11222333000181')).toBe('11222333000181')
  })

  it('handles empty string', () => {
    expect(cleanCnpj('')).toBe('')
  })

  it('handles partial input', () => {
    expect(cleanCnpj('11.222')).toBe('11222')
    expect(cleanCnpj('11.222.333')).toBe('11222333')
  })

  it('removes special characters and letters', () => {
    expect(cleanCnpj('11.222.333/0001-81abc')).toBe('11222333000181')
    expect(cleanCnpj('11-222-333-0001-81')).toBe('11222333000181')
  })
})

describe('formatCnpj', () => {
  it('formats complete CNPJ with mask', () => {
    expect(formatCnpj('11222333000181')).toBe('11.222.333/0001-81')
    expect(formatCnpj('12345678000195')).toBe('12.345.678/0001-95')
  })

  it('formats already masked CNPJ', () => {
    expect(formatCnpj('11.222.333/0001-81')).toBe('11.222.333/0001-81')
  })

  it('formats partial input progressively', () => {
    expect(formatCnpj('11')).toBe('11')
    expect(formatCnpj('112')).toBe('11.2')
    expect(formatCnpj('11222')).toBe('11.222')
    expect(formatCnpj('112223')).toBe('11.222.3')
    expect(formatCnpj('11222333')).toBe('11.222.333')
    expect(formatCnpj('112223330')).toBe('11.222.333/0')
    expect(formatCnpj('1122233300')).toBe('11.222.333/00')
    expect(formatCnpj('112223330001')).toBe('11.222.333/0001')
    expect(formatCnpj('1122233300018')).toBe('11.222.333/0001-8')
    expect(formatCnpj('11222333000181')).toBe('11.222.333/0001-81')
  })

  it('handles empty string', () => {
    expect(formatCnpj('')).toBe('')
  })

  it('ignores extra digits beyond 14', () => {
    expect(formatCnpj('112223330001819999')).toBe('11.222.333/0001-81')
  })
})

describe('validateCnpjFormat', () => {
  it('validates correct format (14 digits)', () => {
    expect(validateCnpjFormat('11.222.333/0001-81')).toBe(true)
    expect(validateCnpjFormat('11222333000181')).toBe(true)
    expect(validateCnpjFormat('12345678000195')).toBe(true)
  })

  it('rejects incorrect format', () => {
    expect(validateCnpjFormat('123')).toBe(false)
    expect(validateCnpjFormat('11.222.333/0001')).toBe(false)
    expect(validateCnpjFormat('1122233300018')).toBe(false) // 13 digits
    expect(validateCnpjFormat('112223330001811')).toBe(false) // 15 digits
  })

  it('rejects empty string', () => {
    expect(validateCnpjFormat('')).toBe(false)
  })

  it('rejects non-numeric input', () => {
    expect(validateCnpjFormat('abc')).toBe(false)
    expect(validateCnpjFormat('11.222.333/0001-XX')).toBe(false)
  })
})

describe('validateCnpjChecksum', () => {
  it('validates correct CNPJs', () => {
    // Valid test CNPJs
    expect(validateCnpjChecksum('11.222.333/0001-81')).toBe(true)
    expect(validateCnpjChecksum('11222333000181')).toBe(true)
    expect(validateCnpjChecksum('12.345.678/0001-95')).toBe(true)
    expect(validateCnpjChecksum('12345678000195')).toBe(true)
  })

  it('rejects CNPJs with invalid checksum', () => {
    expect(validateCnpjChecksum('11.222.333/0001-00')).toBe(false)
    expect(validateCnpjChecksum('11.222.333/0001-99')).toBe(false)
    expect(validateCnpjChecksum('12.345.678/0001-00')).toBe(false)
  })

  it('rejects CNPJs with all same digits', () => {
    expect(validateCnpjChecksum('11111111111111')).toBe(false)
    expect(validateCnpjChecksum('00000000000000')).toBe(false)
    expect(validateCnpjChecksum('99999999999999')).toBe(false)
  })

  it('rejects incorrect format', () => {
    expect(validateCnpjChecksum('123')).toBe(false)
    expect(validateCnpjChecksum('1122233300018')).toBe(false) // 13 digits
    expect(validateCnpjChecksum('')).toBe(false)
  })

  it('handles masked and unmasked input', () => {
    expect(validateCnpjChecksum('11.222.333/0001-81')).toBe(true)
    expect(validateCnpjChecksum('11222333000181')).toBe(true)
  })
})
