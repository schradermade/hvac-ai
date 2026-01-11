# Example Feature (Reference Implementation)

⚠️ **This is a reference implementation - not production code**

This feature demonstrates all the patterns and best practices used in this codebase. Use it as a reference when building new features.

## Purpose

This example shows:

- ✅ How to structure types
- ✅ How to write services (pure business logic)
- ✅ How to test services
- ✅ How to write hooks (state management)
- ✅ How to build components (composition)
- ✅ How to build screens (from components)
- ✅ How to export public API

## Structure

```
_example/
├── components/        # Small, focused UI components
│   ├── ExampleCard.tsx
│   └── ExampleList.tsx
├── hooks/            # State management hooks
│   └── useExample.ts
├── screens/          # Screen components (composed from components)
│   └── ExampleScreen.tsx
├── services/         # Business logic (no React)
│   ├── exampleService.ts
│   └── __tests__/
│       └── exampleService.test.ts
├── types.ts          # TypeScript types
├── index.ts          # Public API
└── README.md         # This file
```

## Key Patterns Demonstrated

### 1. Types First (Contract-Driven Development)

See `types.ts` - define your data structures before writing code.

### 2. Service Layer (Pure Business Logic)

See `services/exampleService.ts` - pure functions, no React, easy to test.

### 3. Service Testing

See `services/__tests__/exampleService.test.ts` - unit tests for business logic.

### 4. React Query Hooks

See `hooks/useExample.ts` - state management with React Query.

### 5. Component Composition

See `components/` - small components that compose together.

### 6. Screen Composition

See `screens/ExampleScreen.tsx` - screens built from components.

### 7. Public API

See `index.ts` - only export what other features need.

## Using This Reference

When building a new feature:

1. Read this README
2. Look at the code in this folder
3. Follow the same patterns
4. Use `npm run create-feature <name>` to scaffold your feature

## File Size Guidelines

Observed in this example:

- **Components**: < 150 lines
- **Hooks**: < 100 lines
- **Services**: < 300 lines
- **Screens**: < 200 lines

If your files exceed these limits, split them into smaller pieces.
