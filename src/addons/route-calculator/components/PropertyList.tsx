'use client'

import { PropertyListItem } from './PropertyListItem'
import type { PropertyInput } from '../types'

interface PropertyListProps {
  properties: PropertyInput[]
  onEdit: (id: string, newAddress: string) => void
  onDelete: (id: string) => void
  onClearAll?: () => void
}

export function PropertyList({ properties, onEdit, onDelete, onClearAll }: PropertyListProps) {
  if (properties.length === 0) {
    return (
      <div className="property-list-empty">
        <p className="property-list-empty-text">
          No properties added yet. Add an address or Zillow URL above.
        </p>
      </div>
    )
  }

  return (
    <div className="property-list-container">
      <div
        className="property-list"
        role="list"
        aria-live="polite"
        aria-label="Property list"
      >
        {properties.map((property, index) => (
          <PropertyListItem
            key={property.id}
            property={property}
            index={index}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
      {onClearAll && properties.length > 0 && (
        <button
          className="clear-all-btn"
          onClick={onClearAll}
          aria-label={`Clear all ${properties.length} properties`}
        >
          Clear All ({properties.length})
        </button>
      )}
    </div>
  )
}
