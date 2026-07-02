# Design System - Acabou o Mony

## Overview
Modern, professional financial application UI with a focus on trust, clarity, and data hierarchy.

## Design Principles
- **Trust through clarity**: Financial data must be immediately scannable
- **Hierarchy through data density**: Numbers are the hero, not decoration
- **Precision over personality**: Clean, confident, no-nonsense
- **Real-time confidence**: Status indicators must be unambiguous

## Color Palette

### Primary Colors
- **Navy Deep** `#0A2540` - Primary brand, headers, critical actions
- **Trust Blue** `#1A56DB` - Interactive elements, links, focus states
- **Slate Whisper** `#F8FAFC` - Background, creates breathing room

### Semantic Colors
- **Success Green** `#10B981` - Positive states, approved transactions
- **Alert Red** `#EF4444` - Warnings, declined transactions, destructive actions
- **Slate Mid** `#64748B` - Secondary text, metadata

### Neutral Palette
- Slate 50-900 for text hierarchy and borders

## Typography

### Font Family
- **Primary**: Inter (400, 500, 600, 700)
  - Display: 600-700 weight for headers
  - Body: 400-500 weight for content
- **Monospace**: System mono for transaction IDs, card numbers, technical data

### Type Scale
- **Heading 1**: 2xl (24px), font-bold, Navy Deep
- **Heading 2**: base (16px), font-semibold, Navy Deep
- **Body**: sm (14px), font-normal, Slate 900
- **Caption**: xs (12px), font-medium, Slate 500
- **Label**: xs (12px), font-semibold, uppercase, tracking-wide, Slate 500

### Special Features
- **Tabular Numbers**: Applied to all financial amounts for alignment
- **Tight Tracking**: Used for brand name and headers

## Components

### Buttons
- **Primary**: Navy Deep background, white text, hover to Trust Blue
- **Secondary**: White background, slate border, slate text
- **Ghost**: Transparent background, slate text
- **Danger**: Alert Red background, white text
- Border radius: 8px (rounded-lg)
- Height: 44px (min-h-11)
- Font: semibold

### Cards
- Border radius: 12px (rounded-xl)
- Border: 1px slate-200
- Shadow: sm
- Header padding: 24px horizontal, 16px vertical
- Content padding: 24px horizontal, 20px vertical

### Inputs & Selects
- Border radius: 8px (rounded-lg)
- Height: 44px (min-h-11)
- Border: 1px slate-300
- Focus: Trust Blue border + ring
- Padding: 16px horizontal

### Badges
- Border radius: 6px (rounded-md)
- Padding: 10px horizontal, 4px vertical
- Font: xs, semibold, uppercase, tracking-wide
- Border: 1px matching background color
- Variants: success, warning, danger, info, neutral

### Status Indicators
- **Signature Element**: Live pulse animation on PENDING/PROCESSING states
- Animated dot with ping effect
- Only appears on active states requiring attention

### Tables
- Header: xs uppercase semibold slate-500
- Row hover: slate-50 background
- Border: slate-100 between rows, slate-200 for header
- Cell padding: 14px vertical, 24px horizontal (outer), 12px (inner)
- Amounts: tabular-nums, semibold, Navy Deep

### Navigation
- Active state: Navy Deep background, white text
- Inactive: Slate-600 text, hover slate-50 background
- Icons: 20px (w-5 h-5) stroke icons
- Border radius: 8px (rounded-lg)
- Padding: 10px vertical, 12px horizontal

## Layout

### Spacing Scale
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px

### Grid
- Gap: 16px (gap-4)
- Responsive: 1 col mobile, 2 cols tablet, 3 cols desktop

### Container
- Max width: Full width with padding
- Padding: 16px mobile, 24px tablet, 32px desktop

## Animations

### Transitions
- Duration: 150ms
- Easing: cubic-bezier(0.4, 0, 0.2, 1)
- Applied to: colors, backgrounds, borders, shadows

### Status Pulse (Signature)
- Duration: 2s
- Easing: cubic-bezier(0.4, 0, 0.6, 1)
- Infinite loop
- Opacity: 1 → 0.4 → 1

## Accessibility

### Focus States
- Visible outline: 2px Trust Blue
- Offset: 2px
- Applied to all interactive elements

### Color Contrast
- All text meets WCAG AA standards
- Status colors tested for colorblind accessibility

### Motion
- Respects `prefers-reduced-motion`
- Pulse animation can be disabled

## Responsive Behavior

### Breakpoints
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

### Mobile Adaptations
- Sidebar: Overlay drawer
- Tables: Card-based layout
- Buttons: Full width on mobile
- Reduced padding and spacing

## Usage Guidelines

### Financial Data
- Always use tabular-nums class
- Bold weight for amounts
- Navy Deep color for emphasis
- Right-align in tables

### Status Communication
- Use StatusBadge component
- Pulse animation for active states
- Clear color coding
- Uppercase labels

### Empty States
- Slate-500 text
- Centered, concise message
- Action button when applicable

### Error States
- Alert Red color
- Clear, actionable message
- Never vague or apologetic
