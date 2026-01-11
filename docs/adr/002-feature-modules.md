# ADR 002: Feature Module Architecture

**Status**: Accepted
**Date**: 2026-01-11
**Decision Makers**: Technical Team
**Tags**: architecture, code-organization

## Context

We need to organize our codebase in a way that:

- Scales as the app grows (MVP → 10+ features)
- Makes it easy to understand where code lives
- Reduces coupling between features
- Enables parallel development (multiple features at once)
- Keeps files small and focused
- Looks professional (staff-engineer level code)

Traditional layer-based architecture (all components in one folder, all hooks in another) becomes unwieldy as apps grow.

## Decision

We will use **Feature Module Architecture** where each feature is a self-contained module with clear boundaries.

## Structure

```
src/
├── features/
│   ├── diagnostic/              # One feature
│   │   ├── components/         # Feature-specific components
│   │   ├── hooks/              # Feature-specific hooks
│   │   ├── screens/            # Screen components
│   │   ├── services/           # Business logic (no React)
│   │   ├── __tests__/          # Tests
│   │   ├── types.ts            # TypeScript types
│   │   └── index.ts            # Public API
│   │
│   ├── equipment/              # Another feature
│   └── parts/                  # Another feature
│
├── lib/                         # Shared infrastructure
│   ├── api/                    # API client
│   ├── storage/                # Database
│   └── utils/                  # Pure utilities
│
└── ui/                          # Design system components
    ├── Button/
    └── Card/
```

## Rationale

### Why Feature Modules?

1. **Colocation**: Related code lives together
   - Easy to find everything about a feature
   - Reduced cognitive load
   - Clear feature boundaries

2. **Explicit Dependencies**: Features export public API

   ```typescript
   // ✅ Good: Import from public API
   import { useDiagnostic } from '@/features/diagnostic';

   // ❌ Bad: Reach into internals
   import { DiagnosticService } from '@/features/diagnostic/services/diagnosticService';
   ```

3. **Parallel Development**: Teams can work on features independently
   - Less merge conflicts
   - Clear ownership
   - Easier code review

4. **Scalability**: Add features without reorganizing
   - Each feature is isolated
   - Can extract to separate package later
   - No "big refactor" needed

5. **Professional Structure**: Industry best practice
   - Used by Google, Meta, Uber
   - Makes code look mature
   - Easier to onboard new developers

### Service Layer Pattern

Each feature has a **service layer** with pure business logic:

```typescript
// services/diagnosticService.ts
class DiagnosticService {
  async sendMessage(jobId: string, message: string): Promise<Response> {
    // Pure business logic, no React
    const payload = this.buildPayload(message);
    return apiClient.post(`/jobs/${jobId}/diagnostic`, payload);
  }

  private buildPayload(message: string) {
    // Helper methods
  }
}

export const diagnosticService = new DiagnosticService();
```

**Benefits**:

- Easy to test (no mocking React)
- Reusable across hooks and components
- Clear separation of concerns
- Can be used in background jobs, workers, etc.

### Hook Layer Pattern

Hooks connect services to components:

```typescript
// hooks/useDiagnostic.ts
export function useDiagnostic(jobId: string) {
  return useQuery({
    queryKey: ['diagnostic', jobId],
    queryFn: () => diagnosticService.getMessages(jobId),
  });
}
```

**Benefits**:

- Encapsulates state management
- Components stay purely presentational
- Easy to swap implementation

### Public API Pattern

Every feature exports only what's needed:

```typescript
// index.ts
export { DiagnosticScreen } from './screens/DiagnosticScreen';
export { useDiagnostic } from './hooks/useDiagnostic';
export type { DiagnosticMode } from './types';

// Services, components, helpers are NOT exported
// Forces other features to use hooks, not services directly
```

**Benefits**:

- Clear feature boundaries
- Prevents tight coupling
- Easy to refactor internals (public API stays stable)
- Self-documenting (index.ts shows what feature provides)

## Alternatives Considered

### Layer-Based Architecture

Traditional approach: organize by technical layer

```
src/
├── components/         # ALL components
│   ├── DiagnosticCard.tsx
│   ├── EquipmentCard.tsx
│   └── ... (100+ files)
├── hooks/             # ALL hooks
├── services/          # ALL services
└── screens/           # ALL screens
```

**Pros**:

- Familiar (common in tutorials)
- Easy to understand initially

**Cons**:

- **Doesn't scale** (components/ folder has 100+ files)
- Hard to find related code (screen is in screens/, component in components/, hook in hooks/)
- **No clear boundaries** (everything can import everything)
- Merge conflicts common (everyone touches same folders)
- **Looks junior** (doesn't demonstrate architectural thinking)

**Why rejected**: Doesn't scale beyond simple apps. Makes codebase messy.

### Monorepo with Separate Packages

Most extreme: each feature is separate npm package

```
packages/
├── feature-diagnostic/
├── feature-equipment/
└── feature-parts/
```

**Pros**:

- Ultimate isolation
- Can version features independently
- Explicit dependencies (package.json)

**Cons**:

- **Overkill for our size** (adds significant complexity)
- Slower builds (multiple packages)
- More tooling (monorepo tools like Turborepo)
- Harder to refactor across features

**Why rejected**: Too complex for MVP. Feature modules give us 80% of benefits with 20% of complexity.

### Domain-Driven Design (DDD)

More complex architectural pattern

**Pros**:

- Very clear boundaries
- Focuses on business domains

**Cons**:

- **High complexity** (bounded contexts, aggregates, repositories)
- Overkill for our app size
- Steep learning curve

**Why rejected**: Feature modules give us good boundaries without DDD complexity.

## Implementation Guidelines

### Feature Size

A feature should be:

- **1-15 files** (if larger, consider splitting)
- **< 2000 lines total** (rough guideline)
- **Cohesive** (one clear purpose)

### When to Create New Feature

Create a new feature when:

- It's a distinct user capability (diagnostic, parts search, job notes)
- It could be disabled without breaking other features
- It has its own UI screens
- It has substantial business logic

Don't create a feature for:

- Simple utilities (put in lib/utils)
- Design system components (put in ui/)
- Small reusable hooks (put in hooks/)

### Dependencies Between Features

**Prefer**: Features don't depend on other features

```typescript
// ✅ Good: Both features use shared lib
diagnostic/ → lib/api
equipment/ → lib/api

// ⚠️ OK: Feature uses another's hook (through public API)
import { useEquipment } from '@/features/equipment';

// ❌ Bad: Feature reaches into another's internals
import { EquipmentService } from '@/features/equipment/services/equipmentService';
```

If features need to share code:

1. Move shared code to lib/ or ui/
2. Use composition (pass data as props)
3. Use events/callbacks for communication

## Consequences

### Positive

- **Clear organization**: Easy to find code
- **Scalable**: Add features without refactoring
- **Parallel development**: Multiple developers work without conflicts
- **Professional appearance**: Code looks mature
- **Easier testing**: Features are isolated
- **Easier refactoring**: Change internals without affecting others

### Negative

- **Initial overhead**: Need to think about feature boundaries
- **Learning curve**: Developers must learn the pattern
- **Potential duplication**: Similar code in multiple features (though we have lib/ for shared code)

### Risks

1. **Features become too large**:
   - **Mitigation**: Split large features into smaller ones
   - **Early warning**: Feature has > 15 files or > 2000 lines

2. **Circular dependencies**:
   - **Mitigation**: Features shouldn't depend on each other
   - **Early warning**: TypeScript circular dependency error

3. **Inconsistent implementation**:
   - **Mitigation**: Reference implementation in \_example/
   - **Code review**: Check new features follow pattern

## Success Metrics

This architecture is successful if:

- [ ] Developers can find feature code in < 30 seconds
- [ ] New features can be added without refactoring existing ones
- [ ] Features have < 5 dependencies on other features
- [ ] Code reviews mention "clean architecture" or "well-organized"
- [ ] Merge conflicts are rare (< 1 per week)

## Examples

### Good Feature Module

```
features/diagnostic/
├── components/
│   ├── MessageCard.tsx          (45 lines)
│   └── DiagnosticModeSelector.tsx (60 lines)
├── hooks/
│   └── useDiagnostic.ts         (80 lines)
├── screens/
│   └── DiagnosticScreen.tsx     (120 lines)
├── services/
│   ├── diagnosticService.ts     (150 lines)
│   └── __tests__/
│       └── diagnosticService.test.ts
├── types.ts                      (50 lines)
└── index.ts                      (10 lines)

Total: ~515 lines, 9 files
```

Clear purpose, reasonable size, well-tested.

### Feature That's Too Large (needs splitting)

```
features/job-management/
├── components/           (20 components, 1500 lines)
├── hooks/                (15 hooks, 1200 lines)
├── screens/              (10 screens, 2000 lines)
├── services/             (5 services, 1500 lines)
└── ...

Total: ~6200 lines, 50+ files
```

**Solution**: Split into smaller features:

- features/job-creation/
- features/job-list/
- features/job-details/

## Review

**Review date**: After 5 features built (Month 3)

Questions to answer:

- Is the pattern working well?
- Are features the right size?
- Are there issues we didn't anticipate?
- Do developers like this structure?

## References

- [Feature-Sliced Design](https://feature-sliced.design/)
- [Bulletproof React](https://github.com/alan2207/bulletproof-react)
- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)
- [Modular Architecture in React Native](https://blog.logrocket.com/react-native-app-architecture-best-practices/)
