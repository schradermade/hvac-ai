# HVAC AI Assistant - Documentation

Welcome to the HVAC AI Assistant documentation. This directory contains all architectural decisions, coding standards, and development guidelines.

## 📚 Core Documentation

Start here to understand the project:

1. **[ARCHITECTURE.md](./ARCHITECTURE.md)** - High-level architecture overview, folder structure, and design principles
2. **[CODING_STANDARDS.md](./CODING_STANDARDS.md)** - Code organization, naming conventions, and quality standards
3. **[FEATURE_DEVELOPMENT.md](./FEATURE_DEVELOPMENT.md)** - Step-by-step guide for building new features
4. **[TECH_STACK.md](./TECH_STACK.md)** - Technology choices and rationale

## 🎯 Architecture Decision Records (ADRs)

Important architectural decisions are documented in `adr/`:

- [001 - React Native with Expo](./adr/001-react-native.md)
- [002 - Feature Module Architecture](./adr/002-feature-modules.md)
- [003 - Offline-First Strategy](./adr/003-offline-first.md)

## 🚀 Quick Start for New Developers

1. Read [ARCHITECTURE.md](./ARCHITECTURE.md) to understand the big picture
2. Read [CODING_STANDARDS.md](./CODING_STANDARDS.md) to learn our patterns
3. Review `src/features/_example/` for reference implementations
4. Read [FEATURE_DEVELOPMENT.md](./FEATURE_DEVELOPMENT.md) before building new features
5. Use `npm run create-feature [name]` to scaffold new features

## 🤖 For AI Assistants

When starting a new session, read these files to maintain consistency:

```
Required reading:
- docs/ARCHITECTURE.md
- docs/CODING_STANDARDS.md
- docs/FEATURE_DEVELOPMENT.md

Reference code:
- src/features/_example/
```

## 📝 Updating Documentation

Documentation should be updated whenever:

- Architecture patterns change
- New standards are adopted
- Important decisions are made
- New developers ask repeated questions

Keep documentation close to the code - it should be a living artifact, not an afterthought.
