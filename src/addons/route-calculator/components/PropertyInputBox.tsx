'use client'

import { useState, KeyboardEvent, useEffect } from 'react'
import { parsePropertyInput, validatePropertyInput } from '../utils/parsePropertyInput'
import { fetchOgImage } from '../server-functions/fetchOgImage'
import type { PropertyInput } from '../types'

interface PropertyInputBoxProps {
  onAdd: (property: PropertyInput) => void
}

export function PropertyInputBox({ onAdd }: PropertyInputBoxProps) {
  const [inputValue, setInputValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoadingThumbnail, setIsLoadingThumbnail] = useState(false)

  // Auto-clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timeout = setTimeout(() => setError(null), 5000)
      return () => clearTimeout(timeout)
    }
  }, [error])

  const handleAdd = async () => {
    if (!validatePropertyInput(inputValue)) {
      if (inputValue.trim().length === 0) {
        setError('Please enter an address or listing URL')
      } else if (inputValue.trim().length < 5) {
        setError('Address is too short (minimum 5 characters)')
      } else {
        setError('Invalid address or URL format')
      }
      return
    }

    const property = parsePropertyInput(inputValue)

    // If it's a listing URL, fetch the thumbnail
    if (property.sourceUrl) {
      setIsLoadingThumbnail(true)
      try {
        const ogData = await fetchOgImage(property.sourceUrl)
        property.thumbnailUrl = ogData.thumbnailUrl || undefined
      } catch (err) {
        console.error('Failed to fetch thumbnail:', err)
        // Continue without thumbnail - not a critical failure
      } finally {
        setIsLoadingThumbnail(false)
      }
    }

    onAdd(property)
    setInputValue('') // Clear input after successful add
    setError(null) // Clear any previous errors
  }

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    // Handle paste - could add multi-line support later
    // For now, just use default paste behavior
  }

  return (
    <div className="property-input-box">
      <label htmlFor="property-input" className="input-label">
        ADD PROPERTY (Address or Zillow URL)
      </label>
      <div className="property-input-row">
        <input
          id="property-input"
          type="text"
          className={`property-input-field ${error ? 'input-error' : ''}`}
          placeholder="Paste address or Zillow URL..."
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value)
            if (error) setError(null) // Clear error on typing
          }}
          onKeyPress={handleKeyPress}
          onPaste={handlePaste}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? 'property-input-error' : undefined}
        />
        <button
          className="property-add-btn"
          onClick={handleAdd}
          disabled={!inputValue.trim() || isLoadingThumbnail}
        >
          {isLoadingThumbnail ? 'LOADING...' : 'ADD'}
        </button>
      </div>
      {error && (
        <div id="property-input-error" className="input-error-message" role="alert">
          {error}
        </div>
      )}
    </div>
  )
}
