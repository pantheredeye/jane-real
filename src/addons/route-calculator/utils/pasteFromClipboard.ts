import { fetchOgImage } from '../server-functions/fetchOgImage'
import type { PropertyInput } from '../types'
import { parsePropertyInput, validatePropertyInput } from './parsePropertyInput'

export type PasteResult = { success: boolean; error?: string }

export async function pasteFromClipboard(
  addProperty: (property: PropertyInput) => void,
): Promise<PasteResult> {
  try {
    const text = await navigator.clipboard.readText()

    if (!text || text.trim().length === 0) {
      return { success: false, error: 'Clipboard is empty' }
    }

    if (!validatePropertyInput(text)) {
      return { success: false, error: 'Invalid address or URL format' }
    }

    const result = parsePropertyInput(text)

    if (!result.success) {
      return { success: false, error: result.error }
    }

    const property = result.property

    if (property.sourceUrl) {
      try {
        const ogData = await fetchOgImage(property.sourceUrl)
        property.thumbnailUrl = ogData.thumbnailUrl || undefined
      } catch (err) {
        console.error('Failed to fetch thumbnail:', err)
      }
    }

    addProperty(property)
    return { success: true }
  } catch (error) {
    if (error instanceof Error && error.name === 'NotAllowedError') {
      return { success: false, error: 'Clipboard permission denied' }
    }
    return { success: false, error: 'Failed to read clipboard' }
  }
}
