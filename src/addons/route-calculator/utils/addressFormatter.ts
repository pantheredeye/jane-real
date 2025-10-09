/**
 * Format addresses with proper comma placement
 * Handles US address format: Street, City, State ZIP
 */

// Common US state abbreviations
const US_STATES = new Set([
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
])

/**
 * Format an address string with proper commas
 *
 * Examples:
 * "123 Main St San Diego CA 92101" -> "123 Main St, San Diego, CA 92101"
 * "123 Main St San Diego CA" -> "123 Main St, San Diego, CA"
 * "123 Main St, San Diego, CA 92101" -> "123 Main St, San Diego, CA 92101" (unchanged)
 */
export function formatAddress(address: string): string {
  // If already has multiple commas, assume it's formatted
  if ((address.match(/,/g) || []).length >= 2) {
    return address
  }

  // Remove any existing commas and extra spaces for consistent parsing
  const cleaned = address.replace(/,/g, '').replace(/\s+/g, ' ').trim()
  const parts = cleaned.split(' ')

  if (parts.length < 3) {
    // Too short to format meaningfully
    return address
  }

  // Try to find State and ZIP at the end
  let stateIndex = -1
  let zipIndex = -1

  // Look for ZIP (5 digits) at the end
  if (/^\d{5}$/.test(parts[parts.length - 1])) {
    zipIndex = parts.length - 1
  }

  // Look for state code (2 uppercase letters)
  const potentialStateIndex = zipIndex !== -1 ? zipIndex - 1 : parts.length - 1
  if (potentialStateIndex >= 0 && US_STATES.has(parts[potentialStateIndex].toUpperCase())) {
    stateIndex = potentialStateIndex
  }

  // If we found a state, format with commas
  if (stateIndex > 0) {
    // Everything before state is street + city
    // We need to find where street ends and city begins
    // Heuristic: City is usually 1-3 words before state

    // Simple approach: assume last 1-2 words before state is city
    const beforeState = parts.slice(0, stateIndex)

    if (beforeState.length === 1) {
      // Just street, no city
      const street = beforeState[0]
      const stateZip = parts.slice(stateIndex).join(' ')
      return `${street}, ${stateZip}`
    }

    // Assume last 1-2 words before state are city
    // If there are 2 words before state, likely "City Name"
    // If more, likely "Street City" or "Long Street City"
    const cityLength = beforeState.length <= 3 ? 1 : Math.min(2, beforeState.length - 1)
    const cityStart = beforeState.length - cityLength

    const street = beforeState.slice(0, cityStart).join(' ')
    const city = beforeState.slice(cityStart).join(' ')
    const stateZip = parts.slice(stateIndex).join(' ')

    return `${street}, ${city}, ${stateZip}`
  }

  // Couldn't detect pattern, return original
  return address
}
