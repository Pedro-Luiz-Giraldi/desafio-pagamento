# Quick Reference Guide - New Design System

## Color Classes

### Primary Colors
```tsx
// Navy Deep (Primary)
className="bg-[#0A2540] text-[#0A2540] border-[#0A2540]"

// Trust Blue (Interactive)
className="bg-[#1A56DB] text-[#1A56DB] border-[#1A56DB]"

// Slate Whisper (Background)
className="bg-[#F8FAFC]"
```

### Semantic Colors
```tsx
// Success
className="bg-[#10B981] text-emerald-700"

// Error/Alert
className="bg-[#EF4444] text-red-700"

// Slate (Text/Borders)
className="text-slate-500 text-slate-600 text-slate-700 text-slate-900"
className="border-slate-100 border-slate-200 border-slate-300"
```

## Typography

### Headings
```tsx
// Page Title (H1)
<h1 className="text-2xl font-bold text-[#0A2540]">Title</h1>

// Section Title (H2)
<h2 className="text-base font-semibold text-[#0A2540]">Section</h2>

// Subtitle
<p className="text-sm text-slate-600 mt-1">Description</p>
```

### Body Text
```tsx
// Regular body
<p className="text-sm text-slate-900">Content</p>

// Secondary text
<span className="text-sm text-slate-600">Secondary</span>

// Caption/Label
<span className="text-xs text-slate-500">Caption</span>
```

### Financial Amounts
```tsx
// Always use tabular-nums for amounts
<span className="font-bold text-[#0A2540] tabular-nums">
  {formatCents(amount)}
</span>
```

### Table Headers
```tsx
<th className="pb-3 px-6 font-semibold text-xs uppercase tracking-wide text-slate-500">
  Column Name
</th>
```

## Common Patterns

### Page Layout
```tsx
<div className="space-y-5">
  {/* Header */}
  <div>
    <h1 className="text-2xl font-bold text-[#0A2540]">Page Title</h1>
    <p className="text-sm text-slate-600 mt-1">Description</p>
  </div>
  
  {/* Content */}
  <Card>...</Card>
</div>
```

### Metric Card
```tsx
<Card>
  <CardContent className="pt-5">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
          Metric Label
        </p>
        <p className="text-3xl font-bold text-[#0A2540] mt-2 tabular-nums">
          {value}
        </p>
      </div>
      <div className="p-2 bg-blue-50 rounded-lg">
        <IconComponent className="w-5 h-5 text-blue-600" />
      </div>
    </div>
  </CardContent>
</Card>
```

### Data Table
```tsx
<div className="overflow-x-auto -mx-6">
  <table className="w-full text-sm">
    <thead>
      <tr className="border-b border-slate-200 text-left">
        <th className="pb-3 px-6 font-semibold text-xs uppercase tracking-wide text-slate-500">
          Header
        </th>
      </tr>
    </thead>
    <tbody>
      <tr className="cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-smooth">
        <td className="py-3.5 px-6 text-slate-900">Data</td>
      </tr>
    </tbody>
  </table>
</div>
```

### Mobile Card (Alternative to Table)
```tsx
<div className="border border-slate-200 rounded-lg p-4 space-y-3 hover:bg-slate-50 cursor-pointer transition-smooth">
  <div className="flex items-start justify-between">
    <div>
      <p className="text-xs font-mono text-slate-500">ID</p>
      <p className="text-sm text-slate-900 mt-1 font-medium">Title</p>
    </div>
    <StatusBadge status={status} />
  </div>
  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
    <span className="text-lg font-bold text-[#0A2540] tabular-nums">
      {formatCents(amount)}
    </span>
    <span className="text-xs text-slate-500">{date}</span>
  </div>
</div>
```

### Form Layout
```tsx
<form className="space-y-4">
  <Input label="Field Label" value={value} onChange={handler} />
  
  <div className="flex justify-end gap-3 pt-2">
    <Button variant="secondary" onClick={onCancel}>
      Cancel
    </Button>
    <Button type="submit">
      Save Changes
    </Button>
  </div>
</form>
```

### Info Row (Detail Pages)
```tsx
<div className="flex justify-between items-center text-sm">
  <span className="text-slate-600 font-medium">Label</span>
  <span className="text-slate-900">Value</span>
</div>
```

## Component Usage

### Button Variants
```tsx
<Button>Primary Action</Button>
<Button variant="secondary">Secondary Action</Button>
<Button variant="ghost">Subtle Action</Button>
<Button variant="danger">Destructive Action</Button>
```

### Status Badge with Pulse
```tsx
// Automatically shows pulse for PENDING/PROCESSING
<StatusBadge status="PENDING" />
<StatusBadge status="APPROVED" />
```

### Loading States
```tsx
// Skeleton
<Skeleton className="h-12 w-full" />

// Spinner in button
<Button disabled={loading}>
  {loading ? <Spinner label="Loading" /> : 'Submit'}
</Button>
```

### Modal
```tsx
<Modal open={isOpen} title="Modal Title" onClose={handleClose}>
  <p className="text-sm text-slate-600 mb-6">Content</p>
  <div className="flex justify-end gap-3">
    <Button variant="secondary" onClick={handleClose}>Cancel</Button>
    <Button onClick={handleConfirm}>Confirm</Button>
  </div>
</Modal>
```

## Spacing Scale

```tsx
// Use consistent spacing
gap-2    // 8px  - tight spacing
gap-3    // 12px - default spacing
gap-4    // 16px - comfortable spacing
gap-5    // 20px - section spacing

space-y-2  // 8px  - tight vertical
space-y-3  // 12px - default vertical
space-y-4  // 16px - comfortable vertical
space-y-5  // 20px - section vertical
```

## Border Radius

```tsx
rounded-lg   // 8px  - buttons, inputs, cards
rounded-xl   // 12px - larger cards, modals
rounded-md   // 6px  - badges, small elements
```

## Transitions

```tsx
// Use the transition-smooth utility
className="transition-smooth hover:bg-slate-50"

// Or explicit
className="transition-all duration-150 ease-in-out"
```

## Responsive Patterns

### Flex to Stack
```tsx
<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
  <div>Title</div>
  <Button>Action</Button>
</div>
```

### Grid Responsive
```tsx
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
  <Card>...</Card>
</div>
```

### Hide/Show
```tsx
<div className="hidden md:block">Desktop Only</div>
<div className="md:hidden">Mobile Only</div>
```

## Common Mistakes to Avoid

❌ **Don't use old colors:**
```tsx
className="bg-emerald-700"  // Old
className="bg-indigo-600"   // Old
```

✅ **Use new colors:**
```tsx
className="bg-[#0A2540]"    // New primary
className="bg-[#1A56DB]"    // New interactive
```

❌ **Don't forget tabular numbers:**
```tsx
<span>{formatCents(amount)}</span>  // Numbers won't align
```

✅ **Always use tabular-nums for amounts:**
```tsx
<span className="tabular-nums">{formatCents(amount)}</span>
```

❌ **Don't use emoji icons:**
```tsx
<span>📦</span>
```

✅ **Use SVG icons:**
```tsx
<OrdersIcon className="w-5 h-5" />
```

## Accessibility Checklist

- [ ] All interactive elements have focus states
- [ ] Color contrast meets WCAG AA
- [ ] Form inputs have labels
- [ ] Buttons have descriptive text
- [ ] Status changes are announced
- [ ] Keyboard navigation works
- [ ] Touch targets are 44px minimum

## Testing Checklist

- [ ] Test on mobile (< 768px)
- [ ] Test on tablet (768px - 1024px)
- [ ] Test on desktop (> 1024px)
- [ ] Test with long text/numbers
- [ ] Test loading states
- [ ] Test error states
- [ ] Test empty states
- [ ] Test dark mode (if applicable)
