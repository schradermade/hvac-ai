# UI Component Library

Professional, accessible components following design principles documented in `/docs/DESIGN_PRINCIPLES.md`.

## Design Tokens

Central source of truth for design system values:

```typescript
import { colors, spacing, typography, borderRadius } from '@/components/ui';

// Use in your components
backgroundColor: colors.primary;
padding: spacing[4];
fontSize: typography.fontSize.base;
```

## Components

### Button

Professional button with variants and states.

```typescript
import { Button } from '@/components/ui';

// Primary action
<Button onPress={handleSave}>Save</Button>

// Variants
<Button variant="secondary">Cancel</Button>
<Button variant="destructive">Delete</Button>
<Button variant="ghost">Skip</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="md">Medium</Button> // default
<Button size="lg">Large</Button>

// States
<Button loading>Saving...</Button>
<Button disabled>Disabled</Button>
<Button fullWidth>Full Width</Button>
```

### Input

Text input with validation and error states.

```typescript
import { Input } from '@/components/ui';

// Basic usage
<Input
  label="Equipment Model"
  placeholder="Enter model number"
  value={model}
  onChangeText={setModel}
/>

// With validation
<Input
  label="Pressure Reading"
  keyboardType="numeric"
  error="Pressure must be between 0-500 PSI"
/>

// With helper text
<Input
  label="Serial Number"
  helperText="Found on the equipment nameplate"
/>
```

### Card

Container for discrete content.

```typescript
import { Card } from '@/components/ui';

// Basic card
<Card>
  <Text>Content here</Text>
</Card>

// Tappable card
<Card onPress={handlePress}>
  <Text>Tap me</Text>
</Card>

// No padding
<Card noPadding>
  <Image source={...} />
</Card>

// No shadow
<Card noShadow>
  <Text>Flat card</Text>
</Card>
```

### Badge

Status indicator with color-coded variants.

```typescript
import { Badge } from '@/components/ui';

<Badge variant="success">Active</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="error">Failed</Badge>
<Badge variant="info">New</Badge>
<Badge variant="neutral">Draft</Badge>
```

### Typography

Consistent text styles with hierarchy.

```typescript
import { Heading, Body, Label, Caption } from '@/components/ui';

<Heading level={1}>Page Title</Heading>
<Heading level={2}>Section Title</Heading>
<Heading level={3}>Subsection</Heading>

<Body>This is body text</Body>
<Body secondary>This is secondary text</Body>

<Label>Form Label</Label>

<Caption>Updated 2 hours ago</Caption>
```

### Loading Components

Loading states and empty states.

```typescript
import { Spinner, EmptyState } from '@/components/ui';

// Loading spinner
<Spinner />
<Spinner message="Loading diagnostics..." />

// Empty state
<EmptyState
  title="No diagnostics yet"
  description="Tap the + button to create your first diagnostic"
/>

// With action
<EmptyState
  title="No results found"
  description="Try adjusting your filters"
  action={<Button onPress={clearFilters}>Clear Filters</Button>}
/>
```

## Design Guidelines

All components follow these principles:

### Touch Targets

- Minimum 44pt height for interactive elements
- Generous padding for field use (gloves)
- Clear press states

### Color Usage

- Color communicates meaning (primary, success, warning, error)
- Maintains WCAG AA contrast ratios
- Avoid color alone (include text/icons)

### Typography

- Clear hierarchy (heading, body, label, caption)
- Readable sizes (minimum 15pt for body)
- Proper line heights (1.4-1.6)

### Spacing

- Consistent 4pt grid system
- Use `spacing` tokens for all padding/margins
- Generous whitespace

### States

- Loading: Spinner or disabled state
- Error: Red border, error message
- Disabled: Reduced opacity, no interaction
- Focus: Blue border

## Examples

### Form Example

```typescript
import { Input, Button } from '@/components/ui';

<View>
  <Input
    label="Equipment Model"
    placeholder="e.g., AC-2000"
    value={model}
    onChangeText={setModel}
    error={errors.model}
  />

  <Input
    label="Pressure Reading"
    placeholder="PSI"
    keyboardType="numeric"
    value={pressure}
    onChangeText={setPressure}
    error={errors.pressure}
  />

  <Button
    onPress={handleSubmit}
    loading={isSubmitting}
    fullWidth
  >
    Submit
  </Button>
</View>
```

### List Card Example

```typescript
import { Card, Badge, Body, Caption } from '@/components/ui';

<Card onPress={() => navigate('Details', { id: item.id })}>
  <View style={styles.row}>
    <Body>{item.title}</Body>
    <Badge variant="success">Active</Badge>
  </View>
  <Caption>Updated {formatDate(item.updatedAt)}</Caption>
</Card>
```

## Best Practices

1. **Always use design tokens** - Never hardcode colors, spacing, or typography
2. **Follow component patterns** - Use provided props, don't override styles unnecessarily
3. **Maintain accessibility** - All interactive elements have proper roles and labels
4. **Keep it simple** - Use existing components before creating new ones
5. **Professional aesthetic** - Clean, minimal, purposeful design

## Adding New Components

When adding new components:

1. Follow the existing component patterns
2. Use design tokens exclusively
3. Include comprehensive JSDoc comments
4. Add examples to this README
5. Ensure minimum 44pt touch targets
6. Test on both iOS and Android
7. Verify accessibility

## Reference

See `/docs/DESIGN_PRINCIPLES.md` for complete design guidelines.
