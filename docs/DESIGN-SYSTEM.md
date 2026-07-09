# CloudPulse AI - Design System Specification

**Phase 1 Deliverable** | Design System for Web Application
**Created:** 2026-07-09 | **Status:** Draft

---

## Color Palette

### Primary Colors
```
Primary Blue (Action): #2563EB
  Dark: #1E40AF
  Light: #DBEAFE
  
Primary Accent: #0EA5E9
  Dark: #0369A1
  Light: #E0F2FE
```

### Semantic Colors
```
Success (Green): #10B981
  Background: #ECFDF5
  Border: #6EE7B7
  
Warning (Amber): #F59E0B
  Background: #FFFBEB
  Border: #FCD34D
  
Error (Red): #EF4444
  Background: #FEE2E2
  Border: #FECACA
  
Info (Sky): #0EA5E9
  Background: #E0F2FE
  Border: #7DD3FC
```

### Neutral (Gray Scale)
```
Neutral 50:  #F9FAFB (almost white)
Neutral 100: #F3F4F6 (very light gray - backgrounds)
Neutral 200: #E5E7EB (light gray - borders)
Neutral 300: #D1D5DB (subtle gray)
Neutral 400: #9CA3AF (medium gray)
Neutral 500: #6B7280 (standard gray - secondary text)
Neutral 600: #4B5563 (darker gray - primary text)
Neutral 700: #374151 (very dark gray)
Neutral 800: #1F2937 (almost black)
Neutral 900: #111827 (black)
```

### Dark Mode Colors
```
Background Primary:    #0F172A (dark navy)
Background Secondary:  #1E293B (charcoal)
Surface:               #1A1F35 (slate)
Text Primary:          #F8FAFC (white)
Text Secondary:        #CBD5E1 (light gray)
Border:                #334155 (slate gray)
```

---

## Typography

### Font Family
```
Primary: "Inter" (system fallback: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto)
Code: "Fira Code" or "Courier New"
```

### Type Scales

#### Display (Hero/Large Headings)
```
Display 1: 48px / 56px (font-size / line-height)
  Font Weight: 700 (Bold)
  Letter Spacing: -0.02em
  Use: Page titles, dashboard main heading
  
Display 2: 36px / 44px
  Font Weight: 700
  Letter Spacing: -0.015em
  Use: Section titles, modal headers
```

#### Heading (Section Titles)
```
H1: 32px / 40px
  Font Weight: 700
  Letter Spacing: -0.01em
  
H2: 24px / 32px
  Font Weight: 600
  Letter Spacing: 0em
  
H3: 20px / 28px
  Font Weight: 600
  Letter Spacing: 0em
  
H4: 18px / 26px
  Font Weight: 600
  Letter Spacing: 0em
```

#### Body Text
```
Body Large: 16px / 24px
  Font Weight: 400
  Letter Spacing: 0em
  Use: Primary body text, content
  
Body Medium: 14px / 20px
  Font Weight: 400
  Letter Spacing: 0em
  Use: Standard body text, labels
  
Body Small: 12px / 16px
  Font Weight: 400
  Letter Spacing: 0em
  Use: Secondary text, helper text, captions
```

#### UI Labels & Buttons
```
Button Large: 16px / 24px
  Font Weight: 600
  Letter Spacing: 0.5px
  
Button Medium: 14px / 20px
  Font Weight: 600
  Letter Spacing: 0.5px
  
Button Small: 12px / 16px
  Font Weight: 600
  Letter Spacing: 0.5px
```

#### Code
```
Code: 13px / 18px (Monospace)
  Font Weight: 400
  Letter Spacing: 0em
  Font Family: "Fira Code"
```

---

## Spacing System (8px Base Unit)

```
XS: 4px   (0.5x)
S:  8px   (1x)
M:  16px  (2x)
L:  24px  (3x)
XL: 32px  (4x)
2XL: 48px (6x)
3XL: 64px (8x)
```

### Usage
- Padding: S, M, L, XL
- Margins: S, M, L, XL, 2XL
- Gaps (between components): S, M, L
- Gutters (page margins): M, L, XL

---

## Border Radius

```
Sharp: 0px (inputs, strict edges)
Small: 4px (buttons, small elements)
Medium: 8px (cards, modals)
Large: 12px (larger panels)
XLarge: 16px (feature sections)
Full: 999px (pills, avatars, badges)
```

---

## Shadow System

### Elevation Levels

```
Elevation 0: No shadow (flat)

Elevation 1 (Hover):
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05)
  
Elevation 2 (Cards):
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 
              0 1px 2px rgba(0, 0, 0, 0.06)
  
Elevation 3 (Floating Panels):
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
              0 4px 6px -2px rgba(0, 0, 0, 0.05)
  
Elevation 4 (Modals, Dropdowns):
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
              0 10px 10px -5px rgba(0, 0, 0, 0.04)
  
Elevation 5 (Top-level overlays):
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25)
```

---

## Component Library

### Buttons

#### Button Variants
- Primary (Blue background, white text)
- Secondary (Gray background, dark text)
- Tertiary (Transparent, blue text, blue border)
- Danger (Red background, white text)
- Ghost (Transparent, hover effect)

#### Button Sizes
- Large (48px height, 16px padding)
- Medium (40px height, 14px padding) - Default
- Small (32px height, 12px padding)
- Icon (32px × 32px)

#### Button States
- Default
- Hover (elevated shadow)
- Active (darker background)
- Disabled (opacity 50%)
- Loading (spinner)

### Input Fields

#### Text Input
- Placeholder: Neutral 400
- Border: Neutral 200 (rest) → Primary Blue (focus)
- Focus ring: 2px solid Primary Blue at 20% opacity
- Height: 40px
- Padding: 8px 12px

#### Labels
- Color: Neutral 600
- Font: Body Small, 600 weight
- Margin bottom: 8px
- Red asterisk (*) for required

#### States
- Default
- Focus (blue border, focus ring)
- Filled (has value)
- Error (red border, error message below)
- Disabled (opacity 50%, cursor disabled)
- Success (green checkmark)

### Cards

#### Card Container
- Background: White (light) / Neutral 800 (dark)
- Border: Neutral 200 (light) / Neutral 700 (dark)
- Border Radius: 12px
- Padding: 16px or 24px
- Shadow: Elevation 2
- Hover: Elevation 3

#### Card Header
- Display flex, space-between
- Title: H3 (20px)
- Optional action buttons right-aligned

#### Card Body
- Flexible content area
- Padding from container

#### Card Footer
- Border-top: 1px Neutral 200
- Padding-top: 16px
- Action buttons right-aligned

### Badges & Tags

#### Badge (Status)
- Height: 20px
- Padding: 4px 8px
- Border Radius: Full
- Font: Body Small, 600 weight
- Examples: Success (green), Warning (amber), Error (red), Info (blue)

#### Tag (Categories)
- Height: 24px
- Padding: 6px 12px
- Border Radius: Small
- Removable (X icon)
- Examples: Service names, environments

### Tables

#### Header Row
- Background: Neutral 100 (light) / Neutral 700 (dark)
- Text: Body Small, 600 weight, Neutral 600
- Padding: 12px
- Border-bottom: 1px Neutral 200

#### Body Rows
- Height: 48px
- Padding: 12px
- Border-bottom: 1px Neutral 100
- Hover: Background Neutral 50

#### Pagination
- Numbers styled as buttons
- Prev/Next arrows
- Current page: Primary Blue background

### Forms

#### Form Group
- Margin bottom: 24px
- Label + Input + Help Text (optional)

#### Select Dropdown
- Similar to input field styling
- Chevron icon right-aligned
- Dropdown arrow: Neutral 400

#### Checkbox
- Size: 16px × 16px
- Border: 2px Neutral 300
- Checked: Primary Blue background with white checkmark
- Focus: Focus ring (2px sky blue)

#### Radio Button
- Size: 16px × 16px
- Border: 2px Neutral 300
- Selected: 6px Primary Blue dot inside
- Focus: Focus ring

### Modal / Dialog

#### Modal Container
- Background: White (light) / Neutral 800 (dark)
- Border Radius: 16px
- Shadow: Elevation 5
- Width: 90% (max 560px)
- Max Height: 90vh (scrollable content)

#### Modal Header
- Display flex, space-between
- Title: H2 (24px)
- Close button (X) top-right
- Border-bottom: 1px Neutral 200

#### Modal Body
- Padding: 24px
- Scrollable if needed

#### Modal Footer
- Border-top: 1px Neutral 200
- Padding: 16px 24px
- Action buttons right-aligned

### Alerts / Notifications

#### Alert Box
- Padding: 16px
- Border-left: 4px solid (color based on type)
- Background: Light tint of color
- Icon: Left-aligned

#### Types
- Success: Green
- Error: Red
- Warning: Amber
- Info: Blue

### Tabs

#### Tab Bar
- Border-bottom: 1px Neutral 200
- Padding: 0

#### Tab Items
- Padding: 12px 16px
- Text: Body Medium, 600 weight
- Default: Neutral 600 text
- Active: Primary Blue text + 2px underline
- Hover: Neutral 700 text

### Tooltips

#### Tooltip Box
- Background: Neutral 900
- Text: White, Body Small
- Padding: 8px 12px
- Border Radius: 6px
- Shadow: Elevation 3
- Arrow: 4px triangle

---

## Charts & Data Visualization

### Line Charts
- Primary line color: Primary Blue
- Secondary lines: Neutral 400
- Fill under curve: Primary Blue at 10% opacity
- Grid: Neutral 200 (light), Neutral 600 (dark)
- Axis text: Body Small, Neutral 500

### Bar Charts
- Primary bars: Primary Blue
- Secondary/comparison: Neutral 300
- Hover: Slightly darker shade
- Labels: Body Small, Neutral 600

### Pie/Donut Charts
- Use semantic colors + primary blue palette
- Legend: Body Small
- Value labels: Body Medium, 600 weight

### Sparklines (Mini Charts)
- Stroke width: 2px
- Color: Primary Blue or semantic color
- No background

### Heatmaps
- Color scale: Green (good) → Yellow → Red (bad)
- Tooltip on hover: Value + label

---

## Interactive States

### Hover
- Background: +5% darker shade
- Shadow: +1 elevation level
- Cursor: pointer

### Active / Pressed
- Background: +10% darker shade
- Shadow: same as hover
- Scale: 98% (subtle press effect)

### Focus
- Outline: 2px solid Primary Blue at 20% opacity
- Outline-offset: 2px
- Ring effect for keyboard accessibility

### Disabled
- Opacity: 50%
- Cursor: not-allowed
- No hover effects

### Loading
- Spinner animation (rotate 360° in 1s)
- Disabled state
- Optional pulse overlay

---

## Responsive Breakpoints

```
Mobile: 320px - 640px
Tablet: 641px - 1024px
Desktop: 1025px - 1920px
Large Desktop: 1921px+
```

### Layout Rules
- Mobile: 1 column, 16px gutters
- Tablet: 2 columns, 20px gutters
- Desktop: 3+ columns, 24px gutters
- Max width: 1440px (centered on larger screens)

---

## Accessibility Guidelines (WCAG 2.1 AA)

### Color Contrast
- Normal text: 4.5:1 (AAA)
- Large text (18px+): 3:1 (AA)
- UI components: 3:1

### Typography
- Minimum font size: 12px (12px acceptable for UI, 14px+ for body)
- Line height: 1.4 minimum
- Letter spacing: Normal to 0.12em

### Interactive Elements
- Minimum touch target: 44px × 44px
- Focus indicators: Always visible
- Focus order: Logical (left-to-right, top-to-bottom)

### Keyboard Navigation
- All interactive elements keyboard accessible
- Tab order logical
- No keyboard traps
- Visible focus indicator on all focusable elements

### Images & Icons
- All icons have aria-labels
- Charts have text alternatives
- SVGs have title/desc

---

## Animation & Transitions

### Timing Functions
```
Fast: 150ms (micro-interactions)
Normal: 300ms (standard transitions)
Slow: 500ms (modal entrance)
```

### Easing
```
ease-in-out: Standard (default for most)
ease-out: Entrances (elements appearing)
ease-in: Exits (elements disappearing)
cubic-bezier(0.4, 0, 0.2, 1): Material Design standard
```

### Common Animations
- Fade in: opacity 0→1, 300ms
- Slide in: translateX -20px→0, 300ms
- Scale in: scale 0.95→1, 300ms
- Hover button: scale 1→1.05, 150ms

---

## Dark Mode

### Automatic Switchover
- Match system preference (prefers-color-scheme)
- Manual toggle available
- Save preference to localStorage

### Dark Mode Color Map
```
Light Background → Dark Background
Neutral 50 → Neutral 900
Neutral 100 → Neutral 800
Neutral 200 → Neutral 700
Text (dark) → Text (light)
Shadows → Subtle (20% instead of 10%)
```

### Dark Mode Specific
- Reduce brightness of colors (20% darker)
- Increase line opacity for better contrast
- Use darker overlay for modals
- Lighter shadows (less contrast needed)

---

## Implementation Notes

- All spacing, sizing, and timing values are scalable
- Use CSS variables for theming
- Components should support both light and dark modes
- Test accessibility with WAVE, Axe DevTools
- All colors meet WCAG AA contrast requirements
