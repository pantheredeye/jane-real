/**
 * Parse Realtor.com URLs to extract property addresses
 *
 * Supported formats:
 * - https://www.realtor.com/realestateandhomes-detail/3620-Councils-Ford-Cv_Hernando_MS_38632_M81090-41455
 * - https://www.realtor.com/realestateandhomes-detail/Street-Address_City_State_Zip_MLS-ID
 */

export function parseRealtorUrl(url: string): string | null {
  // Match the property details section of Realtor.com URLs
  const match = url.match(/realestateandhomes-detail\/([^?#]+)/)

  if (!match) {
    return null
  }

  const urlPath = match[1]

  // Split by underscore to get: [street, city, state_zip, mls]
  // Example: "3620-Councils-Ford-Cv_Hernando_MS_38632_M81090-41455"
  const parts = urlPath.split('_')

  if (parts.length < 2) {
    return null
  }

  // Street address (replace hyphens with spaces)
  const street = parts[0].replace(/-/g, ' ')

  // City
  const city = parts[1] ? parts[1].replace(/-/g, ' ') : ''

  // State and ZIP (if present)
  // Example: "MS_38632" or just "MS"
  const stateZip = parts[2] ? parts[2].replace(/-/g, ' ') : ''

  // Combine all parts with proper formatting
  const addressParts = [street, city, stateZip].filter(Boolean)

  return addressParts.join(', ')
}

/**
 * Check if a URL is a Realtor.com URL
 */
export function isRealtorUrl(url: string): boolean {
  return url.toLowerCase().includes('realtor.com')
}
