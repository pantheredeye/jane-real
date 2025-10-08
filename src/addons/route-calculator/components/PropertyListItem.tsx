'use client'

import { useState } from 'react'
import type { PropertyInput } from '../types'
import { isListingUrl } from '../utils/parsePropertyInput'

interface PropertyListItemProps {
  property: PropertyInput
  index: number
  onEdit: (id: string, newAddress: string) => void
  onDelete: (id: string) => void
}

export function PropertyListItem({ property, index, onEdit, onDelete }: PropertyListItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(property.parsedAddress)

  const handleSaveEdit = () => {
    if (editValue.trim()) {
      onEdit(property.id, editValue)
      setIsEditing(false)
    }
  }

  const handleCancelEdit = () => {
    setEditValue(property.parsedAddress)
    setIsEditing(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit()
    } else if (e.key === 'Escape') {
      handleCancelEdit()
    }
  }

  return (
    <div className="property-list-item">
      <div className="property-list-item-number">{index + 1}</div>

      <div className="property-list-item-content">
        {isEditing ? (
          <input
            type="text"
            className="property-list-item-edit-input"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyPress}
            autoFocus
          />
        ) : (
          <>
            <div className="property-list-item-address">{property.parsedAddress}</div>
            {property.sourceUrl && (
              <div className="property-list-item-badge">
                {isListingUrl(property.sourceUrl) ? '🏠 Listing' : '🔗 URL'}
              </div>
            )}
          </>
        )}
      </div>

      <div className="property-list-item-actions">
        {isEditing ? (
          <>
            <button
              className="property-list-item-btn property-list-item-btn-save"
              onClick={handleSaveEdit}
              aria-label="Save edit"
            >
              ✓
            </button>
            <button
              className="property-list-item-btn property-list-item-btn-cancel"
              onClick={handleCancelEdit}
              aria-label="Cancel edit"
            >
              ✕
            </button>
          </>
        ) : (
          <>
            <button
              className="property-list-item-btn property-list-item-btn-edit"
              onClick={() => setIsEditing(true)}
              aria-label="Edit property"
            >
              ✎
            </button>
            <button
              className="property-list-item-btn property-list-item-btn-delete"
              onClick={() => onDelete(property.id)}
              aria-label="Delete property"
            >
              🗑
            </button>
          </>
        )}
      </div>
    </div>
  )
}
