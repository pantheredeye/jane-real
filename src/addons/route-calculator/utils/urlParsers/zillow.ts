/**
 * Parse Zillow URLs to extract property addresses
 *
 * Supported formats:
 * - https://www.zillow.com/homedetails/123-Main-St-City-State-12345/123456789_zpid/
 * - https://www.zillow.com/homedetails/123-Main-St-City-State-Zip/zpid_number/
 */

export function parseZillowUrl(url: string): string | null {
  // Match the address slug from Zillow homedetails URL
  const match = url.match(/zillow\.com\/homedetails\/([^\/]+)/)

  if (!match) {
    return null
  }

  const urlSlug = match[1]

  // Convert URL slug to readable address
  // Example: "123-Main-St-City-State-12345" -> "123 Main St, City, State 12345"
  const parts = urlSlug.split('-')

  // Remove ZIP code from end if it exists (typically last part before zpid)
  // ZIP codes are usually 5 digits
  const lastPart = parts[parts.length - 1]
  if (/^\d{5}$/.test(lastPart)) {
    parts.pop() // Remove ZIP, we'll add it back with proper formatting
  }

  const addressText = parts.join(' ')

  return addressText
}

/**
 * Check if a URL is a Zillow URL
 */
export function isZillowUrl(url: string): boolean {
  return url.toLowerCase().includes('zillow.com')
}
