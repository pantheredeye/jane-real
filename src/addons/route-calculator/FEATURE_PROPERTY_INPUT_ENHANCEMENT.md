# Feature: Enhanced Property Input with URL Support

## Concept: Paste → Parse → List (Option B)

**Smart Input Box:**
```typescript
// On paste, Enter, or "Add" button click:
- Parse input (detect URL vs address)
- Extract address from Zillow URL if needed
- Add to list below with metadata
- Clear input box
- Show visual feedback (slide in animation)
```

**UI (Mobile-First):**
```
┌─────────────────────────────────────┐
│ [Input: paste address or URL...] [+]│ ← Add button for mobile
└─────────────────────────────────────┘
        ↓ (auto-parse on paste/enter/add)
┌─────────────────────────────────────┐
│ 1. 123 Main St, Boston         [×] │ ← Swipe to delete
│    🔗 From Zillow                   │
│                                     │
│ 2. 456 Oak Ave                 [×] │
│    ✍️ Manual                        │
└─────────────────────────────────────┘
```

**Data Model:**
```typescript
interface PropertyInput {
  id: string
  raw: string              // Original input (never lose this)
  parsed: {
    address: string
    sourceUrl?: string
    sourceType: 'manual' | 'zillow' | 'mls' | 'redfin'
    confidence?: number    // How sure we are it parsed right
  }
  userEdited: boolean      // Track if manually corrected
}
```

**Benefits:**
- ✅ **Transparency** - see what was parsed immediately
- ✅ **Control** - edit/remove individual items before calculating
- ✅ **Error prevention** - catch issues before expensive API calls
- ✅ **Source preservation** - can show "From Zillow" badge
- Parse happens before geocoding (cheaper)
- User sees what they're about to calculate
- Easy to remove duplicates

## Mobile UX Design

**Input Submission:**
- "Add" button (44px touch target)
- OR Enter/Go key on keyboard
- Both methods supported

**List Interactions:**
- Larger touch targets (44px minimum)
- Swipe-to-delete gesture
- Tap item to edit (inline or modal)
- Visual feedback on all actions

**Accessibility:**
- `aria-live="polite"` for list updates
- "Property added" announcements
- Clear focus indicators
- Error states with ARIA labels

## Error Handling

**Parse Errors:**
```
Paste: "123 Main St\nBAD_URL\n456 Oak"
↓
List shows:
✓ 123 Main St
⚠ "BAD_URL" - couldn't parse, tap to edit
✓ 456 Oak
```

**Edge Cases:**
- Invalid URL → show "couldn't parse" inline, let user edit
- Gibberish input → add with warning badge
- Duplicate addresses → warn but allow (might be intentional)
- Geocoding fails later → show error on card, allow retry

## Security

- Sanitize all URL inputs before display
- Validate domain (zillow.com, redfin.com, etc.) before opening links
- No XSS from raw input display
