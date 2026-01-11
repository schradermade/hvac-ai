# HVAC AI Assistant - Project Context

This file is automatically loaded at the start of every Claude Code session.

## Project Standards and Documentation

Before making any changes, review these key documents:

@docs/ARCHITECTURE.md

@docs/CODING_STANDARDS.md

@docs/FEATURE_DEVELOPMENT.md

## Important Guidelines

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
