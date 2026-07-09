# CloudPulse AI - Component Library Specifications

**Phase 1 Deliverable** | Reusable component library for Figma
**Created:** 2026-07-09

---

## Component Hierarchy

```
Components/
├── Atoms (Basic building blocks)
│   ├── Button
│   ├── Input
│   ├── Label
│   ├── Badge
│   ├── Icon
│   ├── Avatar
│   └── Tag
│
├── Molecules (Simple component groups)
│   ├── Form Field
│   ├── Card
│   ├── Alert
│   ├── Modal
│   ├── Tooltip
│   ├── Dropdown
│   ├── Checkbox Group
│   └── Radio Group
│
├── Organisms (Complex sections)
│   ├── Navigation
│   ├── Header
│   ├── Sidebar
│   ├── Data Table
│   ├── Form
│   ├── Dashboard Grid
│   ├── Chart Container
│   └── Notification Center
│
└── Templates (Page layouts)
    ├── Dashboard Layout
    ├── Settings Layout
    ├── Auth Layout
    └── Error Layout
```

---

## Atomic Components

### Button
**States:** Default, Hover, Active, Disabled, Loading
**Variants:** Primary, Secondary, Tertiary, Danger, Ghost
**Sizes:** Small (32px), Medium (40px), Large (48px)
**Props:**
- Text label
- Icon (left/right)
- Loading spinner
- Disabled state
- Full width option

**Implementation in Figma:**
- Main component: `Atoms/Button`
- Variants per state/size/type
- Copy component for each usage

### Input Field
**States:** Default, Focus, Filled, Error, Disabled, Success
**Sizes:** Medium (40px), Large (48px)
**Types:** Text, Email, Password, URL, Number, Search
**Props:**
- Placeholder text
- Label
- Helper text
- Error message
- Required indicator
- Icon (left/right)

**Implementation in Figma:**
- Main: `Atoms/Input`
- Variants for all states
- Auto-layout for padding

### Label
**Props:**
- Text content
- Required indicator (red *)
- Tooltip icon (optional)
- Font size (Small, Medium)

### Badge
**Variants:** Success (Green), Warning (Amber), Error (Red), Info (Blue), Default (Gray)
**Props:**
- Text/number
- Icon (optional)
- Dismissible option

### Icon
**Sizes:** 16px, 20px, 24px, 32px, 48px
**Styles:** Outline, Filled, Solid
**Set:** Heroicons (or custom set)
**Props:**
- Color
- Size
- Rotation
- Animation

### Avatar
**Sizes:** Small (24px), Medium (32px), Large (48px), XL (64px)
**Props:**
- Image URL
- Initial letters
- Background color
- Border radius
- Presence indicator (online/offline)

### Tag
**Props:**
- Text label
- Color/category
- Remove button
- Icon (optional)

---

## Molecular Components

### Form Field
**Composition:**
```
┌─────────────────────────┐
│ Label*                  │
│ ┌─────────────────────┐ │
│ │ [Input Field]       │ │
│ └─────────────────────┘ │
│ Helper text             │
└─────────────────────────┘
```

**Props:**
- Label text
- Input component (various types)
- Required flag
- Helper/error text
- Validation state

### Card
**Composition:**
```
┌──────────────────────────┐
│ Title          [Actions] │
├──────────────────────────┤
│                          │
│ [Content Area]           │
│                          │
├──────────────────────────┤
│ [Footer Actions]         │
└──────────────────────────┘
```

**Props:**
- Header (with actions)
- Body content
- Footer
- No footer variant
- Clickable/hover state

### Alert
**Composition:**
```
[Icon] Title
       Description/Message
       [Action Button]
```

**Variants:** Success, Error, Warning, Info
**Props:**
- Icon (auto from type)
- Title
- Message
- Action button (optional)
- Dismissible

### Modal/Dialog
**Composition:**
```
┌─────────────────────────────┐
│ Title              [X]      │
├─────────────────────────────┤
│ Content                     │
│ (scrollable)                │
├─────────────────────────────┤
│ [Cancel] [Primary Action]   │
└─────────────────────────────┘
```

**Props:**
- Title
- Content
- Backdrop dismissible
- Buttons (cancel, primary, secondary)
- Size (Small, Medium, Large)

### Tooltip
**Composition:** Arrow + Text box
**Props:**
- Content text
- Position (Top, Bottom, Left, Right)
- Trigger (Hover, Click, Focus)
- Delay (150ms default)

### Dropdown/Select
**Composition:**
```
┌────────────────────┐
│ Selected Item [▼]  │ (trigger)
│ ┌────────────────┐ │
│ │ Option 1       │ │
│ │ Option 2       │ │ (menu)
│ │ Option 3       │ │
│ └────────────────┘ │
└────────────────────┘
```

**Props:**
- Options array
- Selected value
- Placeholder
- Searchable
- Multi-select
- Disabled items

### Checkbox/Radio Group
**Composition:**
```
☑ Option 1
☐ Option 2
☐ Option 3
```

**Props:**
- Items array
- Selected states
- Disabled items
- Vertical/horizontal layout

---

## Organism Components

### Navigation (Sidebar)
**Sections:**
- Logo/brand
- Primary nav items
- Secondary nav section
- User menu section

**Props:**
- Active item highlight
- Collapsible state
- Nested items
- Icons for items

### Header
**Left:**
- Hamburger menu toggle
- Breadcrumb navigation

**Right:**
- Search
- Notifications
- User avatar + dropdown

**Props:**
- Title/context
- Search callback
- Notification count

### Sidebar (Left Nav)
**Contains:**
- Navigation items with icons
- Active state indicator
- Hover effects
- Collapsible submenu
- Bottom user section

### Data Table
**Composition:**
```
┌─ Header ──────────────────────┐
│ Name | Type | Status | Action │
├───────────────────────────────┤
│ Row 1 data...                 │
├───────────────────────────────┤
│ Row 2 data...                 │
├───────────────────────────────┤
│ Row 3 data...                 │
├─ Pagination ──────────────────┤
│ 1 2 [3] 4 5 ... Previous Next │
└───────────────────────────────┘
```

**Props:**
- Columns definition
- Row data
- Sortable columns
- Selectable rows
- Pagination/infinite scroll
- Row actions
- Empty state

### Form (Multi-field)
**Contains:**
- Multiple form fields
- Validation
- Submit/Cancel buttons
- Progress/step indicator
- Error summary

**Props:**
- Form fields array
- Validation rules
- Submit callback
- Multi-step support

### Dashboard Grid
**Layout:**
- 12-column grid
- Responsive breakpoints
- Auto-layout for cards
- Responsive spacing

**Props:**
- Grid items
- Breakpoint-specific layouts

### Chart Container
**Composition:**
```
┌─ Title ────────┐
│ ┌────────────┐ │
│ │ [Chart]    │ │
│ └────────────┘ │
│ Legend         │
└────────────────┘
```

**Props:**
- Chart component
- Title
- Legend
- Time range selector
- Download option

### Notification Center
**Composition:**
```
Notifications (4)
─────────────────
[✓] Success message
    2 min ago
[!] Warning message
    5 min ago
[🔴] Error message
    10 min ago
─────────────────
[View All]
```

**Props:**
- Notifications list
- Mark as read
- Dismiss
- Click actions

---

## Template Components

### Dashboard Layout Template
**Sections:**
- Header (full width)
- Sidebar (fixed left)
- Main content area
- Footer (optional)

**Includes:**
- Navigation
- Page title
- Breadcrumbs
- Main content grid

### Settings Layout Template
**Sections:**
- Header
- Settings menu (left sidebar)
- Settings content (main)

**Includes:**
- Navigation
- Settings categories (sidebar)
- Form sections

### Auth Layout Template
**Sections:**
- Centered card
- Logo
- Form
- Footer links

### Error Layout Template
**Sections:**
- Large error icon
- Error code
- Message
- Action buttons

---

## Component Specifications

### Spacing Within Components

**Button:**
- Horizontal padding: 16px (medium), 12px (small), 20px (large)
- Vertical padding: 8px (medium), 6px (small), 10px (large)
- Icon gap: 8px

**Card:**
- Padding: 16px (compact) or 24px (default)
- Header bottom spacing: 16px
- Footer top spacing: 16px

**Form Field:**
- Label bottom margin: 8px
- Helper text top margin: 4px
- Bottom margin (full field): 24px

**Table:**
- Header row height: 40px
- Data row height: 48px
- Cell padding: 12px
- Column gap: 0 (borders instead)

### Color Usage in Components

**Buttons:**
- Primary: Blue background
- Secondary: Gray background
- Tertiary: Transparent + blue border
- Danger: Red background
- Ghost: Transparent

**Inputs:**
- Border (default): Neutral 200
- Border (focus): Primary Blue
- Background: White
- Text: Neutral 900
- Placeholder: Neutral 400

**Cards:**
- Background: White (light) / Neutral 800 (dark)
- Border: Neutral 200
- Shadow: Elevation 2

**Badges:**
- Success: Green background
- Warning: Amber background
- Error: Red background
- Info: Blue background

### Typography Within Components

**Button Text:** 14px, 600 weight, uppercase 0.5px spacing
**Input Label:** 14px, 600 weight
**Card Title:** 18px, 600 weight
**Form Label:** 12px, 600 weight, required *
**Table Header:** 12px, 600 weight, Neutral 600 text
**Table Data:** 14px, 400 weight

---

## Figma Organization Best Practices

### File Structure
```
CloudPulse AI Design System
├── 📄 Overview (description of system)
├── 🎨 Colors & Typography
├── 📦 Components Library
│   ├── Atoms
│   ├── Molecules
│   ├── Organisms
│   └── Templates
├── 🔄 Styles
│   ├── Colors
│   ├── Typography
│   └── Effects
├── 📐 Screens
│   ├── Authentication
│   ├── Dashboards
│   ├── Settings
│   └── Error States
└── 🧪 Prototypes & Interactions
```

### Component Naming Convention
```
Category/ComponentName/Variant

Examples:
- Atoms/Button/Primary/Medium
- Atoms/Button/Secondary/Large/Disabled
- Molecules/Card/Default
- Organisms/Header/Default
- Templates/Dashboard Layout
```

### Variant Naming
```
[State]/[Size]/[Type]

Examples:
- Default/Medium/Primary
- Hover/Large/Secondary
- Active/Small/Danger
- Disabled/Medium/Ghost
```

### Best Practices
1. Use Auto Layout for all components (enables responsive design)
2. Set fixed sizes where appropriate (buttons, avatars)
3. Create constraints for responsive behavior
4. Use variables for colors, typography, spacing
5. Document usage of each component
6. Test components at different sizes
7. Create documentation pages for each component
8. Use plugins like "Storybook Connect" for code synchronization

---

## Validation States for Components

### Input Validation
- **Default:** Border Neutral 200
- **Focus:** Border Primary Blue (2px)
- **Filled:** Border Neutral 300
- **Error:** Border Red, Error message below, ✗ icon right
- **Success:** Border Green, ✓ icon right
- **Disabled:** Opacity 50%, cursor not-allowed

### Form Validation
- **Field-level:** Show error below field
- **Form-level:** Show error summary at top
- **Real-time:** Validate on blur + change
- **Submit:** Disable if any field invalid

### Loading States
- **Button:** Show spinner, disable interactions
- **Input:** Disable interactions, show loading indicator
- **Table:** Show skeleton loaders for rows
- **Chart:** Show loading skeleton

### Empty States
- **Table:** Show "No data" message with icon
- **List:** Show empty state illustration
- **Dashboard:** Show onboarding prompts
- **Search:** Show "No results found"

---

## Responsive Behavior

### Mobile (< 640px)
- Buttons: Full width where possible
- Cards: Single column stack
- Tables: Horizontal scroll or collapse
- Modals: Full screen
- Sidebar: Hidden (hamburger menu)

### Tablet (641px - 1024px)
- Buttons: 50% width or auto
- Cards: 2-column grid
- Tables: Visible with scroll
- Modals: 80% screen width
- Sidebar: Collapsible

### Desktop (1025px+)
- Buttons: Auto width
- Cards: 3+ column grid
- Tables: Full width
- Modals: Fixed width (560px)
- Sidebar: Fixed width (260px)

---

## Accessibility Requirements for Components

- All buttons have visible focus states
- All form inputs have associated labels
- Color is never the only indicator (use icons + text)
- Icon buttons have aria-labels
- Modal has trap focus
- Keyboard navigation fully supported
- Screen reader tested

---

## Next Steps for Figma Build

1. Create main Figma file with this structure
2. Build all atomic components first
3. Combine atoms into molecules
4. Create organisms from molecules
5. Build page templates
6. Create interactive prototypes
7. Set up component documentation
8. Share with developers for handoff
9. Create Figma-to-code plugins integration
10. Version control components

All components should be built with scalability in mind for future enhancements.
