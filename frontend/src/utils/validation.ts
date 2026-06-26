/**
 * CNPJ Validation Utilities
 * 
 * Brazilian CNPJ (Cadastro Nacional da Pessoa Jurídica) validation and formatting.
 * Format: XX.XXX.XXX/XXXX-XX (14 digits total)
 */

/**
 * Removes all non-digit characters from a string
 */
export function cleanCnpj(cnpj: string): string {
  return cnpj.replace(/\D/g, '')
}

/**
 * Formats a CNPJ string with the standard mask: XX.XXX.XXX/XXXX-XX
 * Accepts partial input and formats progressively as user types
 */
export function formatCnpj(value: string): string {
  const digits = cleanCnpj(value)
  
  // Apply mask progressively based on length
  if (digits.length <= 2) {
    return digits
  }
  if (digits.length <= 5) {
    return `${digits.slice(0, 2)}.${digits.slice(2)}`
  }
  if (digits.length <= 8) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`
  }
  if (digits.length <= 12) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`
  }
  // Full format: XX.XXX.XXX/XXXX-XX
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`
}

/**
 * Validates CNPJ format (checks if it has exactly 14 digits)
 */
export function validateCnpjFormat(cnpj: string): boolean {
  const digits = cleanCnpj(cnpj)
  return digits.length === 14
}

/**
 * Validates CNPJ checksum using the Brazilian algorithm
 * 
 * Algorithm:
 * 1. Extract 12 base digits
 * 2. Calculate first check digit using weights [5,4,3,2,9,8,7,6,5,4,3,2]
 * 3. Calculate second check digit using weights [6,5,4,3,2,9,8,7,6,5,4,3,2] + first check digit
 * 4. Compare with provided check digits
 */
export function validateCnpjChecksum(cnpj: string): boolean {
  const digits = cleanCnpj(cnpj)
  
  // Must have exactly 14 digits
  if (digits.length !== 14) {
    return false
  }
  
  // All digits the same is invalid (e.g., 11111111111111)
  if (/^(\d)\1+$/.test(digits)) {
    return false
  }
  
  // Extract base digits and check digits
  const base = digits.slice(0, 12)
  const providedCheckDigits = digits.slice(12, 14)
  
  // Calculate first check digit
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  let sum1 = 0
  for (let i = 0; i < 12; i++) {
    sum1 += parseInt(base[i]) * weights1[i]
  }
  const remainder1 = sum1 % 11
  const checkDigit1 = remainder1 < 2 ? 0 : 11 - remainder1
  
  // Calculate second check digit
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  let sum2 = 0
  for (let i = 0; i < 12; i++) {
    sum2 += parseInt(base[i]) * weights2[i]
  }
  sum2 += checkDigit1 * weights2[12]
  const remainder2 = sum2 % 11
  const checkDigit2 = remainder2 < 2 ? 0 : 11 - remainder2
  
  // Compare calculated check digits with provided ones
  const calculatedCheckDigits = `${checkDigit1}${checkDigit2}`
  return calculatedCheckDigits === providedCheckDigits
}
