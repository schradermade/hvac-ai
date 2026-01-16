# HVACOps - Project Context

This file is automatically loaded at the start of every Claude Code session.

## Current Implementation Status

**Implemented:**

- Feature module architecture (clients, jobs, equipment, diagnostic)
- React Navigation (stack + tab navigation)
- Mock AI diagnostic responses with professional HVAC knowledge
- AsyncStorage for data persistence
- Design system with professional UI components in `src/components/ui/`
- TypeScript strict mode with comprehensive type safety

**Planned for Future:**

- Expo Router migration (currently using React Navigation)
- Real Claude AI API integration (currently mock responses)
- WatermelonDB for local-first data (currently using AsyncStorage)
- Vector DB for semantic search and context injection
- Offline sync system with conflict resolution

## Project Standards and Documentation

Before making any changes, review these key documents:

@docs/ARCHITECTURE.md

@docs/CODING_STANDARDS.md

@docs/FEATURE_DEVELOPMENT.md

@docs/DESIGN_PRINCIPLES.md

## Important Guidelines

- **UI/UX Quality**: Every feature must meet billion-dollar app standards (see DESIGN_PRINCIPLES.md)
  - **Detail screens MUST follow ClientDetailScreen.tsx pattern** - Hero section, icon containers, status badges with dots, professional empty states
  - All new screens should match the quality level of ClientDetailScreen - this is the gold standard
  - Use DESIGN_PRINCIPLES.md "Detail Screen Patterns" section as implementation checklist
- Follow the patterns demonstrated in `src/features/_example/`
- Keep files under size limits: components < 150 lines, hooks < 100 lines, services < 300 lines
- Use the feature module architecture for all new features
- Never include "Co-Authored-By" or mention LLM assistance in git commits
- Run `npm run create-feature <name>` to scaffold new features with correct structure

## Quick Commands

```bash
npm run validate        # Run all code quality checks
npm run create-feature  # Generate new feature scaffold
npm test               # Run tests
```
