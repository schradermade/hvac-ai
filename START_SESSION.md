# New Claude Session Starter

Copy and paste this message at the start of each new Claude Code session:

---

**Before we continue, read these files to understand the project standards:**

- `docs/ARCHITECTURE.md`
- `docs/CODING_STANDARDS.md`
- `docs/FEATURE_DEVELOPMENT.md`

This ensures you follow the established patterns and coding standards for this project.

---

## Quick Reference

After Claude reads the docs, you can:

- Ask questions about the architecture
- Request new features: "Build the authentication feature"
- Get code reviews: "Review this code against our standards"
- Generate features: `npm run create-feature <name>`

## Project Commands

```bash
# Development
npm start                    # Start Expo dev server
npm run create-feature <name> # Scaffold new feature

# Code Quality
npm run validate             # Run all checks (type + lint + format)
npm run type-check           # TypeScript check
npm run lint                 # ESLint check
npm run test                 # Run tests

# Git
git add -A                   # Stage all changes
git commit -m "message"      # Commit (pre-commit hooks run automatically)
git push                     # Push to GitHub
```

## Important Notes

- Never include "Co-Authored-By" or mention LLM assistance in commits
- Follow the patterns in `src/features/_example/`
- Keep files under size limits (components < 150 lines, etc.)
- All features must follow the feature module architecture
