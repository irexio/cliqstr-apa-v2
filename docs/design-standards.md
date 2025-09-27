# 🎨 Cliqstr Design Standards
_Last updated: 2025-09-25_

## 🌈 Color Palette
- Primary: Black (#000000), White (#FFFFFF)
- Accents:
  - Magenta (#c032d1)
  - Aqua (#7ed4de)
- Neutrals: Gray range (#f5f5f5 → #999999)

## 🔤 Typography
- Font: Poppins
- Body text: 16–18px min
- Buttons: 18–20px
- Headings: 20–24px+
- Line Height: 1.4–1.6

## 🖱️ Buttons & Components
- Auth/System buttons (Sign In, Sign Out, Enter Code): keep original styling.
- Core UI buttons (Upload, Edit, Create, Post, Save):
  - Primary: Black bg, White text
  - Secondary: White bg, Black border/text
  - Hover: Invert
  - Disabled: Gray bg/text
- Rule: All buttons black/white (penguin style) to prevent clashes with personalization (Phase 3).

## 🖼 Iconography
- Library: Heroicons default, Lucide fallback
- Style: Outline, black by default
- States: Magenta = active, Aqua = hover
- Exception: Red 🚨 in Parent HQ
- Emojis: Allowed in posts/comments, not UI

## 🧑‍🦯 Accessibility
- Body text min 16px
- Buttons 18–20px
- Touch targets min 44px
- Contrast WCAG AA+
- Scaling (Phase 2): Default / Large / Extra Large

## 🧭 Layout Guidelines
- Desktop (≥1024px): horizontal nav
- Tablet (768–1023px): hamburger nav
- Mobile (≤767px): hamburger nav
- Footer: About, FAQ, Privacy, Safety, What’s New
- Dropdown: Profile, Parent HQ, Settings, Feedback, Logout

## 📏 Spacing & Layout
- Grid System: 8px base unit
- Common Spacing: 8px, 16px, 24px, 32px, 48px
- Component Padding: 16px (mobile), 24px (desktop)
- Section Margins: 32px (mobile), 48px (desktop)
- Button Padding: 12px vertical, 24px horizontal

## 🎭 Animations & Transitions
- Duration: 200ms for micro-interactions, 300ms for page transitions
- Easing: ease-in-out for most transitions
- Hover States: 150ms ease-in-out
- Loading States: Subtle pulse or spin animations
- Page Transitions: Fade in/out, avoid jarring movements

## 🚨 Error States & Feedback
- Error Text: Red (#dc2626) for validation errors
- Error Borders: Red border on form fields with errors
- Success States: Green (#16a34a) for confirmations
- Warning States: Amber (#d97706) for cautions
- Info States: Blue (#2563eb) for informational messages

## ✨ Brand Feel
- Tone: Mature but friendly
- Vibe: Calm, safe, private
- Black/white core + magenta/aqua accents
