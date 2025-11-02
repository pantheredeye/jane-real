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

## Current Status: DEMO FUNCTIONAL - NEEDS POLISH ✅🎨

The demo infrastructure is complete and working. All core functionality is implemented. Polish and refinement needed before merging to main.

**Completed:**
- ✅ TheaterModal reusable animation system
- ✅ DemoContent with full interactive flow
- ✅ PropertyInputBox integration
- ✅ Example addresses and results display
- ✅ Different CTAs for example vs real input

**Ready for polish:**
- 🎨 Comic borders visibility during animation
- 🎨 Mobile UX refinements
- 🎨 Animation timing tweaks
- 🎨 Content/copy adjustments

---

## Tasks

### Setup & Structure ✅ COMPLETE
- [x] Create feature branch `feature/landing-demo`
- [x] Create demo components folder
- [x] Update TODO with reusable architecture plan
- [x] Create TheaterModal.tsx component structure (reusable)
- [x] Set up animation CSS with variables
- [x] Add debug mode for animation speed testing (URL params: ?demo-speed=slow|fast)
- [x] Create DemoContent.tsx wrapper for demo-specific content

### Components ✅ COMPLETE

**Reusable (can be used for other features):**
- [x] TheaterModal.tsx - Generic animated modal container
  - Handles expansion/collapse animation
  - Comic border styling (needs polish - borders not very visible)
  - Close functionality (X button + ESC key)
  - Debug speed controls via URL params
  - Accepts children (any content)
- [x] TheaterCloseButton.tsx - Comic-styled X button (reusable)

**Demo-specific (lives inside TheaterModal):**
- [x] DemoButton.tsx - "See It In Action" trigger button for hero
- [x] DemoContent.tsx - Main demo content wrapper
  - Integrates PropertyInputBox from route-calculator
  - Handles input flow and results display
  - Different CTAs for examples vs real input
- [x] Results display built into DemoContent
- [x] "Use Example Addresses" button built into DemoContent

### Animation Implementation ✅ MOSTLY COMPLETE
- [x] Expansion animation (bottom sheet to full screen)
- [x] Framed modal (95% width on desktop, 4vh gap at top)
- [x] Reverse collapse animation
- [x] Smooth easing curves (no bounce per user request)
- [x] 50ms delay ensures initial state paints before animating
- [x] Test different animation speeds (working via URL params)
- [ ] **NEEDS POLISH:** Comic borders not very visible during animation

### Functionality ✅ COMPLETE
- [x] Integrate PropertyInputBox from route-calculator
- [x] Add "Use Example Addresses" prefill logic (3 Denver addresses)
- [x] Calculate button (swipe-to-calculate not implemented - button only)
- [x] Auto-prefill on empty calculate (triggers example addresses)
- [x] Flag example vs real input for CTA messaging
- [x] Generate demo results (fake times with believable progression)
- [x] Different CTA messages for real vs example input
  - Examples: "These are examples. Sign up for real routes!"
  - Real: "Sign up for real routes!"

### Close Functionality ✅ COMPLETE
- [x] X button styled with comic theme (circular, top-right, retro styling)
- [x] ESC key to close
- [x] Click overlay to close
- [x] Reverse animation on close (works smoothly)
- [x] Return to landing page state
- [ ] **NOT IMPLEMENTED:** Swipe up to close (button/ESC/overlay only)

### Testing & Polish 🎨 IN PROGRESS
- [ ] Test on desktop (Chrome, Firefox, Safari)
- [ ] Test on mobile (responsive behavior)
- [x] Test animation speed options (working via URL params)
- [ ] Verify theme switcher works with demo open
- [ ] Accessibility: keyboard navigation, screen readers
- [ ] Performance: smooth 60fps animation
- [ ] **POLISH NEEDED:**
  - Comic borders more visible/dramatic during animation
  - PropertyInputBox styling in demo context
  - Results screen visual hierarchy
  - Mobile UX refinements
  - Animation timing tweaks if needed
  - Content/copy adjustments

### Integration ✅ COMPLETE
- [x] Add "See It In Action" button to hero section (side-by-side with signup)
- [x] Update hero CTA layout (demo vs signup buttons, flexbox, wraps on mobile)
- [x] Pricing "Start Routing Faster" remains direct to signup (unchanged)

---

## Architecture Benefits ✅
- **Reusable**: TheaterModal can open any content (settings, tools, announcements)
- **Maintainable**: Animation logic separate from demo logic
- **Consistent**: Same theatrical experience across all future modal use cases
- **Flexible**: Easy to add new full-screen interactions

## Design Decisions Made
1. ✅ "See It In Action" sits **next to** "Start Routing Faster" in hero (both visible)
2. ✅ Import PropertyInputBox directly from route-calculator (reuse existing component)
3. ✅ Use fake/random times in demo (believable progression: 9:43 AM → 10:20 AM → etc.)
4. ✅ Text-only results (no map preview - keeps demo fast and simple)
5. ✅ Framed modal approach (95% width, 4vh top gap) vs page-split animation
6. ✅ No bounce in animation easing (smooth deceleration only)
7. ❌ Swipe-to-close NOT implemented (only X button, ESC, overlay click)

## Key Animation Details
- Duration: 0.6s (default), adjustable via `?demo-speed=slow` or `?demo-speed=fast`
- Easing: `cubic-bezier(0.4, 0, 0.2, 1)` - Material Design ease-out
- Starting height: 20vh (desktop), 30vh (mobile)
- Ending size: 95% width × 96vh height (desktop), 100% width × 100vh (mobile)
- 50ms delay before triggering animation ensures initial state renders
- Content fades in after 30% of animation duration

---

## Branch Strategy
- Feature branch: `feature/landing-demo`
- Small, atomic commits ✅ (14 commits so far)
- Commit after each component completion ✅
- Test before merging to main 🎨 (needs polish/testing phase)

## Files Created/Modified

**New files:**
- `src/app/pages/landing/components/demo/TODO.md`
- `src/app/pages/landing/components/demo/TheaterModal.tsx`
- `src/app/pages/landing/components/demo/theater-modal.css`
- `src/app/pages/landing/components/demo/TheaterCloseButton.tsx`
- `src/app/pages/landing/components/demo/theater-close-button.css`
- `src/app/pages/landing/components/demo/DemoButton.tsx`
- `src/app/pages/landing/components/demo/DemoContent.tsx`
- `src/app/pages/landing/components/demo/demo-content.css`

**Modified files:**
- `src/app/pages/landing/components/HeroSection.tsx` (added DemoButton)

## Next Session: Polish Checklist

When you pick this up in a fresh session, focus on:

1. **Comic borders visibility** - Make them more dramatic during animation
2. **Visual polish** - Spacing, colors, hierarchy in demo content
3. **Mobile testing** - Ensure everything works smoothly on small screens
4. **Theme integration** - Test with Comic (red) and Diner (mint) themes
5. **Copy refinement** - Any messaging tweaks needed
6. **Accessibility** - Keyboard navigation, screen reader support
7. **Performance** - Verify 60fps animation
8. **Cross-browser** - Test Chrome, Firefox, Safari

**To start fresh session:**
"Let's continue polishing the landing page demo feature. I want to work on making the comic borders more visible during the animation and general visual polish. The TODO is in src/app/pages/landing/components/demo/Landing_+TODO.md"
