/**
 * Address normalization utilities for duplicate detection
 * Handles variations in address formatting to identify duplicates
 */

/**
 * Normalize an address string for comparison
 * - Trims whitespace
 * - Converts to lowercase
 * - Removes extra spaces
 * - Removes punctuation
 * - Normalizes common street abbreviations
 */
export function normalizeAddress(address: string): string {
  return address
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')           // Collapse multiple spaces to single space
    .replace(/[.,]/g, '')           // Remove commas and periods
    .replace(/\b(street|st)\b/g, 'st')        // Normalize "Street" and "St" to "st"
    .replace(/\b(avenue|ave)\b/g, 'ave')      // Normalize "Avenue" and "Ave" to "ave"
    .replace(/\b(road|rd)\b/g, 'rd')          // Normalize "Road" and "Rd" to "rd"
    .replace(/\b(drive|dr)\b/g, 'dr')         // Normalize "Drive" and "Dr" to "dr"
    .replace(/\b(lane|ln)\b/g, 'ln')          // Normalize "Lane" and "Ln" to "ln"
    .replace(/\b(court|ct)\b/g, 'ct')         // Normalize "Court" and "Ct" to "ct"
    .replace(/\b(circle|cir)\b/g, 'cir')      // Normalize "Circle" and "Cir" to "cir"
    .replace(/\b(boulevard|blvd)\b/g, 'blvd') // Normalize "Boulevard" and "Blvd" to "blvd"
    .replace(/\b(parkway|pkwy)\b/g, 'pkwy')   // Normalize "Parkway" and "Pkwy" to "pkwy"
}

/**
 * Check if two addresses are duplicates
 * Returns true if the normalized addresses match
 */
export function isDuplicateAddress(address1: string, address2: string): boolean {
  const normalized1 = normalizeAddress(address1)
  const normalized2 = normalizeAddress(address2)
  return normalized1 === normalized2
}

/**
 * Find a duplicate address in a list
 * Returns the index of the duplicate, or -1 if not found
 */
export function findDuplicateIndex(address: string, addressList: string[]): number {
  const normalized = normalizeAddress(address)
  return addressList.findIndex(addr => normalizeAddress(addr) === normalized)
}

/**
 * Check if an address exists in a list (case-insensitive, normalized)
 */
export function addressExistsInList(address: string, addressList: string[]): boolean {
  return findDuplicateIndex(address, addressList) !== -1
}
