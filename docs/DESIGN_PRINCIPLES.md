# UI/UX Design Principles

**Mission:** Build a billion-dollar app. Every screen, every component, every interaction should feel professional, efficient, and intuitive. This is a tool for professionals, not a consumer toy.

---

## Core Philosophy

### Professional Tool Aesthetic

This app is a **tool**, not entertainment. It should feel like:

- A precision instrument (Fluke multimeter)
- Professional software (AutoCAD, Figma)
- High-end automotive dashboards (Tesla, Porsche)

NOT like:

- Social media apps
- Gamified consumer apps
- Overly playful designs

### Guiding Question

Before implementing any UI feature, ask:

> **"Would this feel at home in a $50,000/year professional software suite?"**

If the answer is no, refine it.

---

## Design Principles

### 1. Efficiency First

**Every interaction should minimize time and cognitive load.**

- **Information density**: Show relevant data without clutter
- **Quick actions**: Common tasks should be 1-2 taps maximum
- **Smart defaults**: Pre-fill sensible values, remember preferences
- **Keyboard shortcuts**: Support for power users where applicable
- **Gestural efficiency**: Swipe to delete, pull to refresh, long-press for context

❌ BAD: Multiple screens to perform a simple calculation
✅ GOOD: Inline calculator with instant results

### 2. Clarity Over Cleverness

**Every element should have obvious purpose.**

- **Clear labels**: No ambiguous icons without labels
- **Obvious hierarchy**: Important actions stand out
- **Predictable behavior**: Standard patterns, no surprises
- **Visible state**: Users always know what's happening (loading, error, success)

❌ BAD: Mystery meat navigation (unlabeled icons)
✅ GOOD: Clear labels with supportive icons

### 3. Purposeful Design

**Every pixel serves a function.**

- **No decoration**: Every element has utility
- **Generous whitespace**: For focus and breathing room
- **Intentional color**: Color communicates meaning (status, warnings, actions)
- **Typography hierarchy**: Clear distinction between heading, body, labels, data

❌ BAD: Colorful gradients, drop shadows, decorative elements
✅ GOOD: Flat colors, clear contrast, functional use of space

### 4. Mobile-First Professional

**Professional quality on a phone in the field.**

- **Touch-optimized**: Minimum 44x44pt touch targets
- **One-handed usable**: Key actions within thumb reach
- **Glove-friendly**: Larger targets for field use
- **Offline-capable**: Works without connectivity
- **Quick access**: Most used features front and center

❌ BAD: Tiny buttons, complex multi-step flows
✅ GOOD: Large touch targets, simplified workflows

### 5. Progressive Disclosure

**Simple by default, powerful when needed.**

- **Essential first**: Show core features immediately
- **Advanced tucked**: Power features available but not overwhelming
- **Contextual options**: Show relevant actions at the right time
- **Smart defaults**: 80% use case works out of the box

❌ BAD: All features visible at once, overwhelming
✅ GOOD: Clean interface with "Show more" for advanced options

### 6. Feedback & Confidence

**Users always know what's happening.**

- **Instant feedback**: Immediate visual response to actions
- **Progress indicators**: Show loading states for longer operations
- **Confirmations**: Verify destructive actions
- **Error recovery**: Clear error messages with solutions
- **Success states**: Confirm when actions complete

❌ BAD: Silent failures, unclear error messages
✅ GOOD: Toast notifications, inline errors with suggested fixes

---

## Visual Design Standards

### Color Palette

**Functional, not decorative.**

- **Primary Blue** (`#2563eb`): Primary actions, links
- **Success Green** (`#10b981`): Confirmations, positive states
- **Warning Amber** (`#f59e0b`): Caution, review needed
- **Error Red** (`#ef4444`): Errors, destructive actions
- **Neutral Grays**: Background layers, borders, disabled states
  - Surface: `#ffffff`
  - Background: `#f9fafb`
  - Border: `#e5e7eb`
  - Disabled: `#9ca3af`
  - Text Primary: `#1f2937`
  - Text Secondary: `#6b7280`

**Color usage:**

- Color should communicate meaning
- Avoid using color alone (include icons/labels)
- Maintain WCAG AA contrast ratios minimum

### Typography

**Clear hierarchy, easy scanning.**

- **Headings**: 20-24pt, semibold (600)
- **Body**: 15-16pt, regular (400)
- **Labels**: 13-14pt, medium (500)
- **Captions**: 11-12pt, regular (400)
- **Data/Numbers**: Tabular figures, medium weight

**Font stack:**

- iOS: System font (San Francisco)
- Android: Roboto
- Web: System UI stack

### Spacing & Layout

**Consistent rhythm, clear separation.**

- **Base unit**: 4pt (use multiples: 8, 12, 16, 24, 32)
- **Touch targets**: Minimum 44x44pt
- **Margins**: 16pt minimum on mobile
- **Component padding**: 12-16pt internal
- **Section gaps**: 24-32pt between major sections
- **Line height**: 1.4-1.6 for body text

### Elevation & Depth

**Subtle layers, clear hierarchy.**

- **Cards**: Light shadow, 8pt border radius
- **Modals**: Stronger shadow, overlay background
- **Floating actions**: Prominent shadow
- **Avoid**: Heavy shadows, multiple elevation levels

---

## Detail Screen Patterns

**Reference Implementation:** `ClientDetailScreen.tsx` (src/features/clients/screens/)

Detail screens should follow this professional, FAANG-level structure. Every detail screen in the app MUST maintain this quality standard.

### Hero Section

**Large, bold entity name at the top for immediate context.**

- **Font size**: 2xl (24pt), bold weight
- **Placement**: Top of screen with generous padding (spacing[5] top)
- **Badges**: Status or special badges aligned right
- **Purpose**: User immediately knows what they're viewing

```tsx
<View style={styles.heroSection}>
  <Text style={styles.clientName}>{entity.name}</Text>
  {hasSpecialStatus && <Badge variant="warning">Special</Badge>}
</View>
```

### Quick Actions Section

**Primary actions prominently placed below hero.**

- **Placement**: Immediately after hero section
- **Spacing**: spacing[5] bottom margin for separation
- **Button**: Full-width primary button for main action
- **Purpose**: Most common action is one tap away

### Section Headers with Icons

**Every major section needs icon + title + count badge.**

- **Structure**: Icon (24px) + Title (xl, bold) + Count badge (right-aligned)
- **Icon color**: Primary color for visual interest
- **Count badge**: Primary color with 20% opacity background, rounded full
- **Spacing**: spacing[4] horizontal padding, spacing[3] bottom margin

```tsx
<View style={styles.sectionHeaderContainer}>
  <Ionicons name="construct-outline" size={24} color={colors.primary} />
  <Text style={styles.sectionTitle}>Equipment</Text>
  <View style={styles.countBadge}>
    <Text style={styles.countBadgeText}>{items.length}</Text>
  </View>
</View>
```

### Information Cards with Icon Rows

**Contact info and similar data displayed with icons.**

- **Icon containers**: 40x40pt, circular, primary color with 10% opacity
- **Icon size**: 20px within container
- **Layout**: Horizontal with icon on left, content on right
- **Labels**: Uppercase, xs font, letter-spacing 0.5, medium weight
- **Values**: Base font, medium weight, line height 22
- **Spacing**: spacing[4] gap between items

```tsx
<View style={styles.infoItem}>
  <View style={styles.infoIconContainer}>
    <Ionicons name="call-outline" size={20} color={colors.primary} />
  </View>
  <View style={styles.infoContent}>
    <Text style={styles.infoLabel}>PRIMARY PHONE</Text>
    <Text style={styles.infoValue}>{client.phone}</Text>
  </View>
</View>
```

### List Item Cards

**Equipment, jobs, and similar lists need consistent card design.**

- **Card structure**: Horizontal layout with icon container + content + chevron
- **Icon container**: 48x48pt square, rounded (borderRadius.base), primary 10% background
- **Icon**: 24px, primary color
- **Content**: Flex 1, contains header + details + metadata
- **Chevron**: 24px, textMuted color, indicates tappability
- **Spacing**: spacing[4] padding, spacing[3] gap between cards
- **Shadow**: Subtle shadow (shadows.sm) on each card

```tsx
<Card style={styles.equipmentCard}>
  <View style={styles.equipmentContainer}>
    <View style={styles.equipmentIconContainer}>
      <Ionicons name="cube" size={24} color={colors.primary} />
    </View>
    <View style={styles.equipmentContent}>
      <Text style={styles.equipmentName}>{item.name}</Text>
      <Badge variant="neutral">{item.type}</Badge>
      <Text style={styles.equipmentDetail}>{item.details}</Text>
    </View>
    <Ionicons name="chevron-forward" size={24} color={colors.textMuted} />
  </View>
</Card>
```

### Status Badges with Dots

**Job status and similar state indicators need visual cues.**

- **Background**: Status color with 20% opacity
- **Layout**: Horizontal with dot + text
- **Dot**: 6x6pt circle, full status color
- **Text**: xs font, semibold, status color, capitalized
- **Padding**: spacing[2] horizontal, spacing[1] vertical
- **Border radius**: borderRadius.base

```tsx
<View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
  <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
  <Text style={[styles.statusText, { color: statusColor }]}>{status.replace('_', ' ')}</Text>
</View>
```

### Empty States

**Professional, helpful empty states with icons.**

- **Icon**: Large (48px), muted color
- **Title**: lg font, semibold, primary text color
- **Hint**: sm font, secondary text color, centered
- **Spacing**: spacing[8] padding, spacing[3] between elements
- **Purpose**: Tell user why it's empty AND what to do about it

```tsx
<Card style={styles.emptyCard}>
  <Ionicons name="cube-outline" size={48} color={colors.textMuted} />
  <Text style={styles.emptyTitle}>No Equipment Registered</Text>
  <Text style={styles.emptyHint}>Add equipment to track service history</Text>
</Card>
```

### Metadata Display

**Dates, times, and secondary info with icons.**

- **Icon + text layout**: Horizontal with icon (16px) + text
- **Icon**: time-outline, calendar-outline, etc. in textSecondary
- **Text**: sm font, textSecondary color
- **Gap**: spacing[1] between icon and text
- **Purpose**: Quick visual scanning

### Dividers

**Separate distinct sections within cards.**

- **Height**: 1px
- **Color**: colors.border
- **Margin**: spacing[4] vertical
- **Usage**: Between primary info and notes sections

### View All Pattern

**When showing partial lists (top 5 items).**

- **Button**: Text button with arrow
- **Layout**: Centered horizontally, spacing[3] padding vertical
- **Text**: Base font, semibold, primary color
- **Icon**: arrow-forward, 16px, primary color
- **Purpose**: Clear indication there's more to see

### Mandatory Elements

Every detail screen MUST include:

1. ✅ Hero section with entity name
2. ✅ Quick action button (when applicable)
3. ✅ Section headers with icons and counts
4. ✅ Icon containers on list items (48x48pt)
5. ✅ Chevrons on tappable items
6. ✅ Professional empty states
7. ✅ Status indicators with color and icons
8. ✅ Consistent spacing (spacing tokens)
9. ✅ No vertical scroll indicator
10. ✅ Bottom spacer (spacing[8]) for comfortable scrolling

### Quality Bar

**Before shipping any detail screen, verify:**

- Large, bold entity name in hero section
- Icon + title + count on all section headers
- 48x48pt icon containers with 10% primary background
- Status badges with colored dots
- Chevrons on all tappable items
- Professional empty states with large icons
- Uppercase labels with letter spacing
- Consistent card shadows and padding
- No emoji icons (use Ionicons only)
- Feels like a $50k/year professional app

**Reference:** Compare your implementation to ClientDetailScreen.tsx line-by-line to ensure quality parity.

---

## Component Patterns

### Buttons

**Clear, tappable, purposeful.**

- **Primary**: Blue background, white text (main actions)
- **Secondary**: Gray background, dark text (alternative actions)
- **Destructive**: Red background, white text (delete, cancel)
- **Ghost**: Transparent, colored text (tertiary actions)
- **Minimum height**: 44pt
- **Minimum width**: 80pt
- **Loading state**: Show spinner, disable button
- **Disabled state**: Reduced opacity (0.5), no interaction

### Input Fields

**Efficient data entry.**

- **Large touch targets**: 48pt minimum height
- **Clear labels**: Above or inside with floating label
- **Validation**: Inline, as user types when possible
- **Error states**: Red border, error message below
- **Keyboard types**: Numeric, email, phone optimized
- **Autocomplete**: Pre-fill when possible

### Lists & Cards

**Scannable information.**

- **Cards**: For discrete items (equipment, diagnostics)
- **Lists**: For homogeneous data
- **Swipe actions**: Delete, edit, quick actions
- **Pull to refresh**: Standard gesture
- **Empty states**: Helpful message, not just blank
- **Loading states**: Skeleton screens or spinners

### Modals & Sheets

**Focus and context.**

- **Bottom sheets**: Mobile-first, easy dismissal
- **Modals**: For critical decisions
- **Clear exit**: X button, swipe down, or tap outside
- **Focus lock**: Prevent interaction with background
- **Smooth animation**: Slide up, fade in backdrop

### Navigation

**Efficient wayfinding.**

- **Tab bar**: 4-5 main sections maximum
- **Stack navigation**: Clear back button, titles
- **Deep linking**: Support URL-based navigation
- **Search**: Prominent for large datasets

### Forms

**Premium data entry experience.**

Forms are critical touchpoints. They must feel effortless, not like a chore.

**Visual Structure:**

- **Clear sections**: Group related fields with subtle dividers or spacing
- **Progressive disclosure**: Show only essential fields first, "Show more" for optional
- **Smart defaults**: Pre-fill whenever possible (current date, last used values)
- **Field order**: Most important/frequently changed fields first

**Input Types:**

- **Text inputs**: Large (48pt), clear labels, proper keyboard types
- **Pickers**: Use bottom sheet/modal pickers, NOT inline wheel pickers (too clunky)
- **Date/Time**: Native pickers with clear format display
- **Toggles**: For boolean choices, with clear on/off states
- **Multi-select**: Chips or checkboxes, not dropdowns

**Validation & Feedback:**

- **Inline validation**: Check as user types (after field blur)
- **Clear error states**: Red border + specific error message below field
- **Success indicators**: Subtle checkmark for valid fields
- **Smart assistance**: Suggest corrections (e.g., "Did you mean 2024?")

**Actions:**

- **Fixed bottom bar**: Primary and cancel buttons always visible
- **Clear hierarchy**: Primary action (filled), secondary (outlined)
- **Disable when invalid**: Show why form can't be submitted
- **Loading states**: Button shows spinner, form dims, prevents double-tap

**Polish:**

- **Smooth keyboard handling**: Form scrolls to keep active field visible
- **Autofill support**: Integrate with platform autofill APIs
- **Persistence**: Draft saves automatically (don't lose work)
- **Haptic feedback**: Subtle vibration on errors or completion

❌ BAD: Inline wheel pickers eating screen space, unclear required fields, silent failures
✅ GOOD: Modal pickers, clear labels with asterisks, helpful error messages, smooth animations

---

## Interaction Patterns

### Gestures

- **Tap**: Primary action
- **Long press**: Context menu, additional options
- **Swipe**: Navigate, reveal actions
- **Pull down**: Refresh
- **Pinch**: Zoom (where relevant)

### Loading States

- **Instant**: Optimistic updates (assume success)
- **Fast (<500ms)**: Small spinner or subtle indicator
- **Moderate (500ms-2s)**: Spinner with message
- **Long (>2s)**: Progress bar with percentage

### Animations

**Purposeful, not decorative.**

- **Duration**: 200-300ms for most transitions
- **Easing**: Natural curves (ease-out for entrances, ease-in for exits)
- **Purpose**: Guide attention, indicate relationships
- **Reduce motion**: Respect accessibility settings

---

## Data Visualization

### Numbers & Metrics

**Scannable, contextual.**

- **Emphasis**: Large numbers for key metrics
- **Units**: Always included, not ambiguous
- **Trends**: Show direction (up/down arrows)
- **Comparison**: Provide context (vs last week, vs target)

### Charts & Graphs

**Simple, focused.**

- **Minimal decoration**: No 3D, no excessive gridlines
- **Clear labels**: Axis labels, legend when needed
- **Color meaning**: Use color to highlight, not decorate
- **Touch-optimized**: Large touch targets for interactive elements

---

## Content Guidelines

### Tone & Voice

**Professional, concise, helpful.**

- **Direct**: Get to the point quickly
- **Active voice**: "Check the pressure" not "The pressure should be checked"
- **Technical but clear**: Use correct terminology, explain when needed
- **No fluff**: Remove unnecessary words

### Messaging

**Error messages:**

- Say what went wrong
- Explain why it happened
- Provide next steps

❌ "Error: Failed to save"
✅ "Couldn't save diagnostic. Check your internet connection and try again."

**Empty states:**

- Explain why it's empty
- Show how to add content

❌ "No items"
✅ "No diagnostics yet. Tap + to create your first one."

---

## Quality Checklist

Before shipping any screen, verify:

### Visual

- [ ] Follows design system colors and typography
- [ ] Consistent spacing (4pt grid)
- [ ] All touch targets ≥44pt
- [ ] WCAG AA contrast ratios met
- [ ] Works in light and dark mode (future)

### Functional

- [ ] Works offline (when applicable)
- [ ] Loading states implemented
- [ ] Error states handled gracefully
- [ ] Success feedback provided
- [ ] Keyboard dismisses appropriately

### Polish

- [ ] Smooth animations (no jank)
- [ ] Haptic feedback where appropriate
- [ ] Empty states are helpful
- [ ] Copy is clear and concise
- [ ] Feels fast and responsive

### Professional

- [ ] Would this feel at home in a $50k/year app?
- [ ] Is every element purposeful?
- [ ] Would a technician want to use this in the field?

---

## Anti-Patterns

**Avoid these common mistakes:**

### ❌ Consumer App Patterns

- Gamification (badges, points, streaks)
- Excessive animations or decorations
- Social features where unnecessary
- Playful or casual tone

### ❌ Over-Engineering

- Complex navigation hierarchies
- Too many options/settings
- Feature bloat (build what's needed)
- Clever but non-obvious interactions

### ❌ Poor Mobile UX

- Small touch targets (<44pt)
- Requiring two hands
- Excessive scrolling
- Hidden navigation

### ❌ Unclear States

- Silent failures
- Ambiguous loading indicators
- No feedback on actions
- Unclear error messages

---

## Reference Examples

### Apps to Study (Professional Tools)

- **Fluke Connect**: Clean, data-focused, field-ready
- **Fieldwire**: Construction management, efficient workflows
- **ServiceTitan**: HVAC business software, comprehensive but clear

### Design Systems to Reference

- **Apple Human Interface Guidelines**: Mobile best practices
- **Material Design 3**: Component patterns
- **Vercel Design**: Clean, professional aesthetic
- **Linear**: Efficiency-focused UI

---

## Continuous Improvement

### Regular Reviews

- Weekly UI/UX reviews of new features
- User testing with actual HVAC technicians
- Metrics tracking (time to complete tasks)
- Iterate based on real usage patterns

### Stay Current

- Follow industry-leading design systems
- Study competitor apps
- Attend to user feedback
- Evolve standards as needed

---

## Summary

**Remember:** This is a professional tool for skilled technicians. Every design decision should enhance efficiency, clarity, and confidence. When in doubt, choose the simpler, more direct option. Build for the technician in the field with gloves on, in bright sunlight, needing an answer in 30 seconds.

**If it doesn't feel like a billion-dollar app, it's not ready to ship.**
