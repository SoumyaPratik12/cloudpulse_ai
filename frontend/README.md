# Frontend - CloudPulse AI

A modern, responsive React + TypeScript frontend for CloudPulse AI, a B2B SaaS platform for cloud infrastructure monitoring, cost analysis, and optimization.

## Tech Stack

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS 3
- **UI Components**: Custom component library
- **Charts**: Recharts
- **Icons**: Lucide React
- **Routing**: React Router v6
- **Package Manager**: npm

## Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable component library
│   │   ├── Atomic/         # Button, Input, Badge, Avatar, etc.
│   │   ├── Molecular/      # Card, Alert, Modal, FormField, etc.
│   │   └── Organism/       # Header, Sidebar, DataTable, etc.
│   ├── pages/              # Page components
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── SettingsPage.tsx
│   │   ├── ResourcesPage.tsx
│   │   └── Error pages
│   ├── hooks/              # Custom React hooks
│   ├── types/              # TypeScript type definitions
│   ├── App.tsx             # Main app component with routing
│   ├── main.tsx            # Entry point
│   └── index.css           # Global styles
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── vite.config.ts
└── index.html
```

## Features

### Design System
- **Colors**: Primary (blue), Success (green), Warning (amber), Error (red), Neutral scale
- **Typography**: 8px base spacing, Inter font, semantic sizes (Display, H1-H4, Body, Code)
- **Components**: 50+ pre-built components with variants, sizes, and states
- **Dark Mode**: Automatic light/dark mode toggle with class-based switching
- **Accessibility**: WCAG 2.1 AA compliance, proper contrast ratios, focus states

### Pages
- **Authentication**: Login page with email/password
- **Dashboard**: Executive overview with stats, charts, and recommendations
- **Resources**: Cloud infrastructure management and monitoring
- **Settings**: Organization and preference management
- **Error States**: 404, 403, 500 error pages

### Components
- Atomic: Button, Input, Badge, Avatar, Checkbox, Radio, Select
- Molecular: Card, Alert, Modal, FormField, Tooltip
- Organism: Header, Sidebar, DataTable, StatCard, ChartContainer
- Layouts: DashboardLayout for consistent styling across pages

## Development

### Install Dependencies
```bash
npm install
```

### Start Development Server
```bash
npm run dev
```

Opens at `http://localhost:3000`

### Build for Production
```bash
npm run build
```

Output in `dist/` folder, ready for deployment.

### Type Check
```bash
npm run type-check
```

### Lint
```bash
npm run lint
```

## Component Usage

### Button
```tsx
<Button 
  variant="primary" 
  size="md" 
  icon={<Plus className="h-4 w-4" />}
  isLoading={false}
>
  Click me
</Button>
```

### Input
```tsx
<Input
  label="Email"
  type="email"
  placeholder="you@example.com"
  error={error}
  helperText="We'll never share your email"
  required
/>
```

### Card
```tsx
<Card 
  header={<h2>Title</h2>}
  footer={<Button>Action</Button>}
>
  Card content
</Card>
```

### DataTable
```tsx
<DataTable 
  columns={[
    { key: 'name', label: 'Name' },
    { key: 'value', label: 'Value' }
  ]}
  rows={data}
  onRowClick={(row) => console.log(row)}
/>
```

## Styling

### Tailwind Configuration
Custom design tokens configured in `tailwind.config.ts`:
- Extended colors with semantic palette
- Custom spacing scale (4px-64px)
- Custom typography (Display, H1-H4, Body, Code)
- Custom shadows (elevation system)
- Custom border radius

### Using Design Tokens
```tsx
// Colors
<div className="bg-primary-500 text-neutral-900 dark:text-neutral-50">

// Spacing
<div className="p-md gap-lg"> {/* 16px padding, 24px gap */}

// Typography
<p className="text-h2 font-semibold"> {/* 24px heading, 600 weight */}

// Elevation
<div className="shadow-elevation-3">
```

## Dark Mode

Automatic dark mode toggle in the Header component. Settings are persisted in localStorage.

```tsx
// Enable dark mode
document.documentElement.classList.add('dark')

// Disable dark mode
document.documentElement.classList.remove('dark')

// Use in components
<div className="bg-white dark:bg-neutral-800">
```

## Deployment

The frontend can be deployed as a static site:

1. Run `npm run build`
2. Deploy the `dist/` folder to any static hosting (Netlify, Vercel, AWS S3, etc.)

For Docker deployment, see `docker/Dockerfile.frontend`

## Performance

- **Code Splitting**: Automatic by Vite
- **Bundle Size**: ~180KB gzipped (main bundle)
- **Asset Optimization**: Automatic CSS/JS minification
- **Development**: Fast HMR with Vite

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Create a new branch for your feature
2. Follow the component structure and naming conventions
3. Ensure TypeScript types are correct
4. Test responsive design across breakpoints
5. Commit with clear messages

## License

Proprietary - CloudPulse AI
