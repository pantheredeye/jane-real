'use client'

import { useState, useRef, useEffect } from 'react'
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
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

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

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMenuOpen])

  // Close menu on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false)
      }
    }

    if (isMenuOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isMenuOpen])

  const handleEdit = () => {
    setIsMenuOpen(false)
    setIsEditing(true)
  }

  const handleDelete = () => {
    setIsMenuOpen(false)
    onDelete(property.id)
  }

  const hasListingUrl = property.sourceUrl && isListingUrl(property.sourceUrl)

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
          <div className="property-list-item-address">{property.parsedAddress}</div>
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
            {/* View Listing button - only show for listing URLs */}
            {hasListingUrl && (
              <a
                href={property.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="property-list-item-btn property-list-item-btn-view-listing"
                aria-label="View listing"
              >
                View Listing
              </a>
            )}

            {/* Three-dot menu */}
            <div className="property-list-item-menu" ref={menuRef}>
              <button
                className="property-list-item-btn property-list-item-btn-menu"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="More actions"
                aria-expanded={isMenuOpen}
              >
                ⋮
              </button>

              {isMenuOpen && (
                <div className="property-list-item-dropdown">
                  <button
                    className="property-list-item-dropdown-item"
                    onClick={handleEdit}
                  >
                    ✎ Edit
                  </button>
                  <button
                    className="property-list-item-dropdown-item property-list-item-dropdown-item-delete"
                    onClick={handleDelete}
                  >
                    🗑 Delete
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
