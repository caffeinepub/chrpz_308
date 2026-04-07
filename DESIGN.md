# Design Brief

| Aspect | Direction |
|--------|-----------|
| **Tone** | Direct, minimal, functional social platform |
| **Visual Direction** | Clean light mode with patriotic USA colors; white backgrounds, red CTAs, navy text |
| **Color Palette** | Primary red `oklch(43.5 0.23 26)` (#B22234), white backgrounds `oklch(100 0 0)`, navy text `oklch(28 0.06 268)` (#3C3B6E) |
| **Typography** | Inter (body, 400–600 weights); system stack fallback |
| **Shape Language** | Minimal border-radius (0.375rem); sharp, direct UI |
| **Elevation & Depth** | Subtle borders and 1px shadows on cards; no glassmorphism |
| **Structural Zones** | White header with red accents; white feed cards with navy text and thin borders; footer minimal |
| **Spacing & Rhythm** | Compact single-column feed; 1rem gaps between cards; 0.5rem internal padding |
| **Component Patterns** | White cards with red buttons; navy links and text; hover state: lift + soft shadow |
| **Motion** | Minimal; 0.2s ease transitions on interactive elements only; respect prefers-reduced-motion |
| **Differentiation** | Unapologetic patriotic aesthetic for a social platform; no dark mode or excessive decoration |
| **Signature Detail** | Red accent bar on hovered cards; red primary buttons and links stand out on white backgrounds |

## Palette (OKLCH)

| Token | OKLCH | Hex | Usage |
|-------|-------|-----|-------|
| background | 100 0 0 | #FFFFFF | Page background, card backgrounds |
| foreground | 28 0.06 268 | #3C3B6E | Body text, headlines |
| primary | 43.5 0.23 26 | #B22234 | Buttons, links, accents |
| muted | 97 0 0 | #F7F7F7 | Secondary backgrounds, disabled states |
| border | 92 0 0 | #EBEBEB | Card borders, dividers |
| destructive | 37 0.25 29 | #A01A28 | Error/warning states |

## Structural Zones

| Zone | Background | Border | Elevation |
|------|-----------|--------|-----------|
| Header | white (background) | bottom border (border) | none |
| Navigation | white | none | 1px subtle shadow |
| Feed Container | white | none | none |
| Post Cards | white | 1px border (border) | hover: 1px shadow (subtle) |
| Buttons | primary/secondary | none | none |

## Responsive Design

Mobile-first: single-column feed (full width `<768px`), sticky header, touch-friendly button sizes (44px+). Desktop: feed remains single-column for post focus (no multi-column grid).

## Constraints

No wallet displays, no wallet/tipping UI. No dark mode toggle. No decorative gradients or animations. Maximum visual simplicity.
