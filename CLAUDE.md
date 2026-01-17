# HVACOps - Project Context

This file is automatically loaded at the start of every Claude Code session.

## Current Implementation Status

**Fully Implemented (Phases 1-6):**

- ✅ **Authentication System** - Login, signup, logout, session management with secure token storage
- ✅ **Multi-Tenant Architecture** - Company and technician management with data isolation
- ✅ **Feature Module Architecture** - Clients, jobs, equipment, diagnostic, technicians, auth
- ✅ **Job Assignment Workflow** - Admin assigns → Tech accepts/declines → Start → Complete
- ✅ **Audit Trail** - Track who created/modified all records (createdBy, modifiedBy)
- ✅ **Collaborative Diagnostics** - Multi-participant AI chat sessions with role-based attribution
- ✅ **Role-Based Access Control** - Admin, lead_tech, technician, office_staff roles
- ✅ **React Navigation** - Stack + tab navigation with role-based tab visibility
- ✅ **Mock AI Diagnostic** - Professional HVAC troubleshooting responses
- ✅ **AsyncStorage** - Secure auth token and user data persistence
- ✅ **Design System** - Professional UI components with FAANG-level quality standards
- ✅ **TypeScript Strict Mode** - Comprehensive type safety throughout

**Planned for Future:**

- **Cloudflare Backend Infrastructure** - Global edge API with 88% cost savings vs traditional stack (see @docs/CLOUDFLARE_ARCHITECTURE.md)
  - Workers: Global API endpoints with <50ms latency worldwide
  - AI Gateway: Claude API proxy with 60% cost reduction via intelligent caching
  - Vectorize: Semantic search over HVAC manuals for context injection
  - R2: File storage with zero egress fees ($10k/month savings vs S3)
  - Durable Objects: Real-time WebSocket collaboration (UI ready, backend planned)
  - KV: Edge session caching and company settings
  - D1: Equipment catalog at edge for fast reads
- WatermelonDB for local-first data (currently using in-memory storage)
- Offline sync system with conflict resolution
- Push notifications for job assignments and diagnostic invitations

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
