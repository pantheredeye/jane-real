'use client'

import { useState, KeyboardEvent } from 'react'
import { parsePropertyInput, validatePropertyInput } from '../utils/parsePropertyInput'
import type { PropertyInput } from '../types'

interface PropertyInputBoxProps {
  onAdd: (property: PropertyInput) => void
}

export function PropertyInputBox({ onAdd }: PropertyInputBoxProps) {
  const [inputValue, setInputValue] = useState('')

  const handleAdd = () => {
    if (!validatePropertyInput(inputValue)) {
      alert('Please enter a valid address or listing URL')
      return
    }

    const property = parsePropertyInput(inputValue)
    onAdd(property)
    setInputValue('') // Clear input after successful add
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
          className="property-input-field"
          placeholder="Paste address or Zillow URL..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          onPaste={handlePaste}
        />
        <button
          className="property-add-btn"
          onClick={handleAdd}
          disabled={!inputValue.trim()}
        >
          ADD
        </button>
      </div>
    </div>
  )
}
