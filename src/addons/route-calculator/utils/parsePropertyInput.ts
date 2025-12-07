import type { PropertyInput } from '../types'
import { parseZillowUrl, isZillowUrl } from './urlParsers/zillow'
import { parseRealtorUrl, isRealtorUrl } from './urlParsers/realtor'
import { formatAddress } from './addressFormatter'

export type ParseResult =
  | { success: true; property: PropertyInput }
  | { success: false; error: string }

/**
 * Parse user input to detect if it's a listing URL or plain address
 * Supports:
 * - Plain addresses: "123 Main St, City, State"
 * - Zillow URLs: https://www.zillow.com/homedetails/...
 * - Realtor.com URLs: https://www.realtor.com/realestateandhomes-detail/...
 */
export function parsePropertyInput(rawInput: string): ParseResult {
  const trimmed = rawInput.trim()

  // Try parsing as Zillow URL
  if (isZillowUrl(trimmed)) {
    const parsedAddress = parseZillowUrl(trimmed)
    if (parsedAddress) {
      return {
        success: true,
        property: {
          id: crypto.randomUUID(),
          rawInput: trimmed,
          parsedAddress: formatAddress(parsedAddress),
          sourceUrl: trimmed
        }
      }
    }
    // URL looks like Zillow but couldn't parse
    return {
      success: false,
      error: 'Zillow URL format not supported (try property detail page)'
    }
  }

  // Try parsing as Realtor.com URL
  if (isRealtorUrl(trimmed)) {
    const parsedAddress = parseRealtorUrl(trimmed)
    if (parsedAddress) {
      return {
        success: true,
        property: {
          id: crypto.randomUUID(),
          rawInput: trimmed,
          parsedAddress: formatAddress(parsedAddress),
          sourceUrl: trimmed
        }
      }
    }
    // URL looks like Realtor but couldn't parse
    return {
      success: false,
      error: 'Realtor.com URL format not supported (try property detail page)'
    }
  }

  // Plain address input
  return {
    success: true,
    property: {
      id: crypto.randomUUID(),
      rawInput: trimmed,
      parsedAddress: formatAddress(trimmed),
      sourceUrl: undefined
    }
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
