'use client'

import { useState } from 'react'
import type { PropertyInput } from '../types'
import { isListingUrl } from '../utils/parsePropertyInput'
import { Menu } from '../../../app/components/ui/Menu'

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

  const hasListingUrl = property.sourceUrl && isListingUrl(property.sourceUrl)

  return (
    <div className={`property-list-item ${isMenuOpen ? 'menu-open' : ''}`}>
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
          <Menu.Root open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <Menu.Trigger
              className="property-list-item-btn property-list-item-btn-menu"
              aria-label="More actions"
            >
              ⋮
            </Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner side="bottom" align="end" sideOffset={4}>
                <Menu.Popup className="property-list-item-dropdown">
                  {hasListingUrl && (
                    <Menu.LinkItem
                      href={property.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="property-list-item-dropdown-item property-list-item-dropdown-link"
                    >
                      🏠 View Listing
                    </Menu.LinkItem>
                  )}
                  <Menu.Item
                    className="property-list-item-dropdown-item"
                    onClick={() => setIsEditing(true)}
                  >
                    ✎ Edit
                  </Menu.Item>
                  <Menu.Item
                    className="property-list-item-dropdown-item property-list-item-dropdown-item-delete"
                    onClick={() => onDelete(property.id)}
                  >
                    🗑 Delete
                  </Menu.Item>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        )}
      </div>
    </div>
  )
}
