import type { PropertyInput } from '../types'

/**
 * Parse user input to detect if it's a Zillow URL or plain address
 * Supports:
 * - Plain addresses: "123 Main St, City, State"
 * - Zillow URLs: https://www.zillow.com/homedetails/123-Main-St-City-State-12345/123456789_zpid/
 */
export function parsePropertyInput(rawInput: string): PropertyInput {
  const trimmed = rawInput.trim()

  // Check if input is a Zillow URL
  const zillowMatch = trimmed.match(/zillow\.com\/homedetails\/([^\/]+)/)

  if (zillowMatch) {
    // Extract address from URL slug
    const urlSlug = zillowMatch[1]
    // Convert URL slug to readable address
    // Example: "123-Main-St-City-State-12345" -> "123 Main St City State"
    const addressParts = urlSlug.split('-').slice(0, -1) // Remove ZIP code at end
    const parsedAddress = addressParts.join(' ')

    return {
      id: crypto.randomUUID(),
      rawInput: trimmed,
      parsedAddress,
      sourceUrl: trimmed
    }
  }

  // Plain address input
  return {
    id: crypto.randomUUID(),
    rawInput: trimmed,
    parsedAddress: trimmed,
    sourceUrl: undefined
  }
}

/**
 * Validate that input is not empty and has minimum content
 */
export function validatePropertyInput(input: string): boolean {
  const trimmed = input.trim()
  return trimmed.length >= 5 // Minimum reasonable address length
}

/**
 * Check if input looks like a URL (Zillow or other listing sites)
 */
export function isListingUrl(input: string): boolean {
  const trimmed = input.trim().toLowerCase()
  return (
    trimmed.includes('zillow.com') ||
    trimmed.includes('redfin.com') ||
    trimmed.includes('realtor.com')
  )
}
