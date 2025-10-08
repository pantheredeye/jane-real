# Smart Property Input - Implementation TODO

## Phase 1: Core Implementation ✅ COMPLETE

### 1. Data Types & Utilities ✅
- [x] Add `PropertyInput` interface to `types.ts`
- [x] Create `utils/parsePropertyInput.ts` with URL detection and parsing logic
- [x] Add Zillow URL pattern matching and address extraction
- [x] Add input sanitization and validation

### 2. New Components ✅
- [x] Create `PropertyInputBox.tsx` - input field with Add button
  - [x] Handle paste events
  - [x] Handle Enter key submission
  - [x] Handle Add button click
  - [x] Parse input and emit to parent
  - [x] Clear input after add
- [x] Create `PropertyList.tsx` - list container
  - [x] Map through properties
  - [x] Empty state display
  - [x] aria-live announcements
- [x] Create `PropertyListItem.tsx` - individual list item
  - [x] Display address with source badge
  - [x] Delete button (44px touch target)
  - [ ] Swipe-to-delete gesture (deferred to Phase 2)
  - [x] Edit functionality (inline)
  - [ ] Error state display (deferred to Phase 2)

### 3. HomePage Integration ✅
- [x] Update `HomePage.tsx` to use new input components
- [x] Replace `AddressInput` with `PropertyInputBox` + `PropertyList`
- [x] Add state management for property list
- [x] Wire up add/edit/delete handlers
- [x] Update calculate route to use property list
- [x] Preserve existing start time and duration selectors

### 4. PropertyCard Enhancement ✅
- [x] Add "View Listing" button when `sourceUrl` exists
- [x] Fix "Get Directions" blank page bug
  - [x] Verify Google Maps URL format
  - [x] Use proper `window.open()` or same-tab navigation
- [x] Add visual indicator for listing source (badge)

### 5. Styling (Mobile-First) ✅
- [x] Style `PropertyInputBox` - input + Add button layout
- [x] Style `PropertyList` - cards/chips design
- [x] Style `PropertyListItem` - touch targets, badges, animations
- [x] Add slide-in animation for new items
- [ ] Add swipe-to-delete visual feedback (deferred)
- [x] Ensure 44px minimum touch targets
- [ ] Test on mobile viewport (needs user testing)

## Phase 2: Polish & Error Handling

### 6. Error Handling
- [ ] Show warning for unparseable input
- [ ] Handle invalid Zillow URLs gracefully
- [ ] Display geocoding errors on items
- [ ] Add retry mechanism for failed items

### 7. User Experience
- [ ] Add visual feedback for all interactions
- [ ] Implement duplicate detection (warn, don't block)
- [ ] Add confirmation for delete (if needed)
- [ ] Add clear all functionality
- [ ] Loading states during parse/add

### 8. Accessibility
- [ ] Add ARIA labels to all interactive elements
- [ ] Ensure keyboard navigation works
- [ ] Test with screen reader
- [ ] Add focus management
- [ ] Announce list updates

## Phase 3: Future Enhancements (Optional)

- [ ] Persist property list to localStorage
- [ ] Add drag-to-reorder
- [ ] Support for Redfin URLs
- [ ] MLS number parsing (when available)
- [ ] Bulk paste multiple lines at once

## Testing Checklist

- [ ] Test paste single address
- [ ] Test paste single Zillow URL
- [ ] Test paste multiple items (mixed)
- [ ] Test Enter key submission
- [ ] Test Add button submission
- [ ] Test edit functionality
- [ ] Test delete functionality
- [ ] Test swipe-to-delete on mobile
- [ ] Test error states (bad URL, etc.)
- [ ] Test "View Listing" button on PropertyCard
- [ ] Test "Get Directions" - verify no blank page
- [ ] Test calculate route with new input system
- [ ] Test on mobile device (real device)
- [ ] Test accessibility with screen reader

## Files to Create/Modify

### New Files
- `src/addons/route-calculator/utils/parsePropertyInput.ts`
- `src/addons/route-calculator/components/PropertyInputBox.tsx`
- `src/addons/route-calculator/components/PropertyList.tsx`
- `src/addons/route-calculator/components/PropertyListItem.tsx`

### Files to Modify
- `src/addons/route-calculator/types.ts` (add PropertyInput interface)
- `src/addons/route-calculator/pages/HomePage.tsx` (integrate new components)
- `src/addons/route-calculator/components/PropertyCard.tsx` (add View Listing button, fix Get Directions)
- `src/addons/route-calculator/styles.css` (add new component styles)

### Files to Deprecate (Later)
- `src/addons/route-calculator/components/AddressInput.tsx` (keep until migration complete)
