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
        'User-Agent': 'Mozilla/5.0 (compatible; RouteCalculator/1.0)',
      },
    })

    if (!response.ok) {
      console.error(`Failed to fetch ${url}: ${response.status}`)
      return { thumbnailUrl: null, title: null, description: null }
    }

    const html = await response.text()

    // Parse og:image meta tag
    const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i)
    const thumbnailUrl = ogImageMatch ? ogImageMatch[1] : null

    // Also grab og:title and og:description while we're here
    const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i)
    const title = ogTitleMatch ? ogTitleMatch[1] : null

    const ogDescriptionMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i)
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
