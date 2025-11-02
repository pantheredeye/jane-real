'use server'

// Fetch Open Graph image from a URL
// Used to get property thumbnails from Zillow, Realtor.com, etc.

interface OgImageResult {
  thumbnailUrl: string | null
  title: string | null
  description: string | null
}

export async function fetchOgImage(url: string): Promise<OgImageResult> {
  try {
    // Fetch the HTML page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    })

    if (!response.ok) {
      console.error(`Failed to fetch ${url}: ${response.status}`)
      return { thumbnailUrl: null, title: null, description: null }
    }

    const html = await response.text()

    // Try multiple patterns for og:image
    let thumbnailUrl = null

    // Pattern 1: property="og:image" content="..."
    let match = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i)
    if (match) thumbnailUrl = match[1]

    // Pattern 2: content="..." property="og:image"
    if (!thumbnailUrl) {
      match = html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i)
      if (match) thumbnailUrl = match[1]
    }

    // Pattern 3: name="og:image" (some sites use name instead of property)
    if (!thumbnailUrl) {
      match = html.match(/<meta\s+name=["']og:image["']\s+content=["']([^"']+)["']/i)
      if (match) thumbnailUrl = match[1]
    }

    // Pattern 4: Look for any og:image in a more lenient way
    if (!thumbnailUrl) {
      match = html.match(/og:image["']?\s+content=["']([^"']+)["']/i)
      if (match) thumbnailUrl = match[1]
    }

    // Also grab og:title and og:description while we're here
    const ogTitleMatch = html.match(/<meta\s+(?:property|name)=["']og:title["']\s+content=["']([^"']+)["']/i) ||
                         html.match(/<meta\s+content=["']([^"']+)["']\s+(?:property|name)=["']og:title["']/i)
    const title = ogTitleMatch ? ogTitleMatch[1] : null

    const ogDescriptionMatch = html.match(/<meta\s+(?:property|name)=["']og:description["']\s+content=["']([^"']+)["']/i) ||
                                html.match(/<meta\s+content=["']([^"']+)["']\s+(?:property|name)=["']og:description["']/i)
    const description = ogDescriptionMatch ? ogDescriptionMatch[1] : null

    return {
      thumbnailUrl,
      title,
      description,
    }
  } catch (error) {
    console.error('Error fetching og:image:', error)
    return { thumbnailUrl: null, title: null, description: null }
  }
}
