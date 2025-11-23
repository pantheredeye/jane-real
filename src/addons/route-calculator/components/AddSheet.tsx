'use client'

import { Drawer } from 'vaul'
import { PropertyInputBox } from './PropertyInputBox'
import { PropertyList } from './PropertyList'
import type { PropertyInput } from '../types'

interface AddSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  properties: PropertyInput[]
  onAdd: (property: PropertyInput) => void
  onEdit: (id: string, newAddress: string) => void
  onDelete: (id: string) => void
  onClearAll: () => void
}

export function AddSheet({
  open,
  onOpenChange,
  properties,
  onAdd,
  onEdit,
  onDelete,
  onClearAll
}: AddSheetProps) {
  // TODO: Per-property duration editing in list items (future enhancement)

  return (
    <Drawer.Root
      open={open}
      onOpenChange={onOpenChange}
      // Sheet stays open after adding - user dismisses when done
      dismissible={true}
    >
      <Drawer.Portal>
        <Drawer.Overlay />
        <Drawer.Content aria-describedby={undefined}>
          <Drawer.Handle />
          <div className="sheet-content">
            <Drawer.Title className="sheet-title">PROPERTIES</Drawer.Title>

            {/* Input for adding new properties */}
            <PropertyInputBox onAdd={onAdd} />

            {/* Editable property list */}
            <PropertyList
              properties={properties}
              onEdit={onEdit}
              onDelete={onDelete}
              onClearAll={onClearAll}
            />
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
