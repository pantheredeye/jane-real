# Landing Page Demo Feature - TODO

## Architecture: Reusable Theater Modal Pattern

This feature is built as a **reusable modal system** that can be used for demos, settings, tools, announcements, or any future full-screen interactions.

### Component Split:
- **TheaterModal.tsx** - Reusable animated modal container (animation + borders + close)
- **DemoContent.tsx** - Demo-specific content (PropertyInputBox + results + CTAs)

This allows future use cases like:
```tsx
<TheaterModal><SettingsPanel /></TheaterModal>
<TheaterModal><ToolsPanel /></TheaterModal>
<TheaterModal><AnnouncementContent /></TheaterModal>
```

## Design Goals
- **Delight**: Theatrical, memorable "wow" moment
- **On-theme**: Retro comic aesthetic with bold borders
- **Smooth UX**: Modern smooth expansion following iOS/Android best practices
- **Natural motion**: Physics-based animation, no jarring jumps
- **Reusable**: Pattern can be used for any full-screen modal interaction

## User Flow
1. Click "See It In Action" button → expansion animation
2. Demo opens with PropertyInputBox (empty)
3. User options:
   - Paste their own addresses → calculate → "Sign up to see actual results"
   - Click "Use Example Addresses" → prefills → calculate → "These are examples. Sign up for real routes"
   - Swipe with nothing → auto-prefills examples
4. Swipe down (or button) to calculate route
5. Results display: simple list of addresses with times
6. CTA: "Sign Up to See Real Routes" (or variant for examples)
7. Close: X button (comic styled) or swipe up → reverse animation

## Animation Details
- Expansion: Bottom sheet style that smoothly expands to full screen
- Styled with thick comic borders (matching landing page theme)
- CSS variables for timing: `--demo-animation-duration: 0.6s`
- Reverse animation on close
- Debug mode: URL param for speed testing

## Results Display (Simple)
```
Address 1 → 9:43 AM
Address 2 → 10:20 AM
Address 3 → 11:05 AM

Total Drive Time: 45 min
Total Showing Time: 2h 15min
```

---

## Tasks

### Setup & Structure
- [x] Create feature branch `feature/landing-demo`
- [x] Create demo components folder
- [x] Update TODO with reusable architecture plan
- [ ] Create TheaterModal.tsx component structure (reusable)
- [ ] Set up animation CSS with variables
- [ ] Add debug mode for animation speed testing
- [ ] Create DemoContent.tsx wrapper for demo-specific content

### Components

**Reusable (can be used for other features):**
- [ ] TheaterModal.tsx - Generic animated modal container
  - Handles expansion/collapse animation
  - Comic border styling
  - Close functionality (X button + swipe)
  - Debug speed controls
  - Accepts children (any content)
- [ ] TheaterCloseButton.tsx - Comic-styled X button (reusable)

**Demo-specific (lives inside TheaterModal):**
- [ ] DemoButton.tsx - "See It In Action" trigger button for hero
- [ ] DemoContent.tsx - Main demo content wrapper
- [ ] DemoInput.tsx - PropertyInputBox integration or copy
- [ ] DemoResults.tsx - Simple results display
- [ ] ExampleButton.tsx - "Use Example Addresses" button

### Animation Implementation
- [ ] Expansion animation (bottom to full screen)
- [ ] Comic border styling during expansion
- [ ] Reverse collapse animation
- [ ] Smooth easing curves (physics-based)
- [ ] Add subtle anticipation pause before expansion
- [ ] Test different animation speeds

### Functionality
- [ ] Integrate PropertyInputBox from route-calculator
- [ ] Add "Use Example Addresses" prefill logic
- [ ] Implement swipe-to-calculate interaction
- [ ] Add calculate button (alternative to swipe)
- [ ] Auto-prefill on empty swipe
- [ ] Flag example vs real input for CTA messaging
- [ ] Generate demo results (fake times or simple calculation)
- [ ] Different CTA messages for real vs example input

### Close Functionality
- [ ] X button styled with comic theme
- [ ] Swipe up to close handler
- [ ] Reverse animation on close
- [ ] Return to landing page state

### Testing & Polish
- [ ] Test on desktop (Chrome, Firefox, Safari)
- [ ] Test on mobile (responsive behavior)
- [ ] Test animation speed options
- [ ] Verify theme switcher works with demo open
- [ ] Test swipe gestures on mobile
- [ ] Accessibility: keyboard navigation, screen readers
- [ ] Performance: smooth 60fps animation

### Integration
- [ ] Add "See It In Action" button to hero section
- [ ] Update hero CTA layout (demo vs signup buttons)
- [ ] Ensure pricing "Start Routing Faster" remains direct to signup

---

## Architecture Benefits
- **Reusable**: TheaterModal can open any content (settings, tools, announcements)
- **Maintainable**: Animation logic separate from demo logic
- **Consistent**: Same theatrical experience across all future modal use cases
- **Flexible**: Easy to add new full-screen interactions

## Open Questions
1. Should "See It In Action" replace or sit next to "Start Routing Faster" in hero?
2. Copy PropertyInputBox or import directly from route-calculator?
3. Calculate real routes in demo or use fake/random times?
4. Include static map preview in results, or text-only?

---

## Branch Strategy
- Feature branch: `feature/landing-demo`
- Small, atomic commits
- Commit after each component completion
- Test before merging to main
