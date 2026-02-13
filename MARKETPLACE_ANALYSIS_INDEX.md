# Marketplace Transformation Analysis - Complete Index

## Overview

This analysis provides a comprehensive understanding of the current marketplace architecture and a detailed roadmap for adding a "Service/Gig" domain alongside the existing "Project" domain.

---

## Documents Included

### 1. MARKETPLACE_TRANSFORMATION_ANALYSIS.md (8.2 KB)
**Comprehensive technical analysis of the current system**

Contains:
- Complete database schema overview (all 20+ tables)
- Domain types and interfaces (TypeScript)
- Category system and constants
- Pricing and commission logic
- Port interfaces (repositories and providers)
- Usecase implementations
- Architecture patterns (Hexagonal/Ports & Adapters)
- Detailed refactoring requirements for Service domain
- New entities needed (Service, ServiceTier, ServiceOrder)
- Database schema changes required
- Type system changes
- Usecase changes
- Refactoring roadmap (4 phases)
- Summary comparison table

**Best for**: Understanding the complete current architecture and what needs to change

---

### 2. ARCHITECTURE_QUICK_REFERENCE.md (12 KB)
**Visual and structural reference guide**

Contains:
- ASCII diagrams of current domain model
- Project lifecycle data flow
- Architecture layers (API → Usecases → Ports → Adapters → External Systems)
- Key enums and status flows
- Proposed Service domain addition diagram
- Project vs Service comparison table
- Complete file structure
- Key validation rules
- Integration points (Payment, Contract, Search flows)

**Best for**: Quick visual understanding and reference during development

---

### 3. TRANSFORMATION_ROADMAP.md (8.0 KB)
**Step-by-step implementation plan with timeline**

Contains:
- 7 phases with detailed tasks:
  - Phase 1: Analysis & Planning (completed)
  - Phase 2: Abstraction Layer (2-3 weeks)
  - Phase 3: Service Domain Implementation (3-4 weeks)
  - Phase 4: Unification & Integration (2-3 weeks)
  - Phase 5: Search Integration (1-2 weeks)
  - Phase 6: UI/UX Updates (3-4 weeks)
  - Phase 7: Optimization & Polish (2 weeks)
- Detailed tasks for each phase with code examples
- Testing strategy for each phase
- Timeline summary (19 weeks total)
- Risk mitigation strategies
- Success criteria
- Next steps
- Key decisions needed

**Best for**: Planning implementation and tracking progress

---

## Quick Start Guide

### For Architects/Tech Leads
1. Start with **ARCHITECTURE_QUICK_REFERENCE.md** for visual overview
2. Read **MARKETPLACE_TRANSFORMATION_ANALYSIS.md** sections 1-7 for deep dive
3. Use **TRANSFORMATION_ROADMAP.md** for planning

### For Developers
1. Read **ARCHITECTURE_QUICK_REFERENCE.md** file structure section
2. Review **MARKETPLACE_TRANSFORMATION_ANALYSIS.md** sections 2-6 for types and ports
3. Follow **TRANSFORMATION_ROADMAP.md** Phase 2-3 for implementation details

### For Product Managers
1. Review **ARCHITECTURE_QUICK_REFERENCE.md** Project vs Service comparison
2. Read **TRANSFORMATION_ROADMAP.md** timeline and success criteria
3. Check "Questions & Decisions Needed" section in roadmap

### For Database Administrators
1. Study **MARKETPLACE_TRANSFORMATION_ANALYSIS.md** section 1 (schema)
2. Review **TRANSFORMATION_ROADMAP.md** Phase 4 (migrations)
3. Check migration examples in Phase 3-4

---

## Key Findings Summary

### Current Architecture
- **Type**: Project-based marketplace for AI video creation
- **Pattern**: Hexagonal architecture (Ports & Adapters)
- **Database**: Supabase PostgreSQL with Drizzle ORM
- **Key Entities**: Project, Proposal, Contract, Milestone, Payment, Review, Dispute, Message
- **Integrations**: Toss Payments (escrow), Modusign (e-signature), OpenAI (embeddings)

### Project Domain Characteristics
- Client-initiated (client creates project)
- Budget range-based pricing
- Complex specs (VideoBrief, Storyboard, Shotlist)
- Multi-milestone workflow
- Creator bids via proposals

### Service Domain Characteristics (Proposed)
- Creator-initiated (creator publishes service)
- Fixed price with optional tiers
- Simple description-based specs
- Single or multi-milestone workflow
- Client purchases directly or negotiates via proposal

### Shared Entities (Can be Reused)
- Proposal (generic bid mechanism)
- Contract (generic agreement)
- Milestone & Payment (generic escrow & delivery)
- Review & Dispute (generic quality & conflict)
- Message (generic communication)
- Creator Profile (generic creator data)

### Project-Specific Entities (Need Abstraction)
- VideoBrief (project-specific video specs)
- Storyboard (project-specific scene planning)
- Shotlist (project-specific shot planning)

---

## Critical Implementation Decisions

### 1. Abstraction Level
**Decision**: Create generic "Workable" interface to represent both projects and services
**Impact**: Allows code reuse for shared entities
**Effort**: Medium (Phase 2)

### 2. Database Schema
**Decision**: Add `workable_type` column to shared tables (proposals, contracts, milestones, etc.)
**Impact**: Enables single table to serve both domains
**Effort**: High (Phase 4, requires migration)

### 3. Search Strategy
**Decision**: Extend existing search to include services with separate results
**Impact**: Users can search both projects and services
**Effort**: Low-Medium (Phase 5)

### 4. Service Categories
**Decision**: Create separate SERVICE_CATEGORIES from PROJECT_CATEGORIES
**Impact**: Different category options for services vs projects
**Effort**: Low (Phase 3)

### 5. Pricing Model
**Decision**: Services use fixed base price + optional tiers; Projects use budget range
**Impact**: Different pricing logic for each domain
**Effort**: Medium (Phase 3-4)

---

## File Locations Reference

### Core Domain Files
```
src/core/
├── types/
│   ├── project.ts          # Project types
│   ├── proposal.ts         # Proposal types
│   ├── milestone.ts        # Milestone types
│   ├── review.ts           # Review & Dispute types
│   ├── profile.ts          # Profile types
│   ├── portfolio.ts        # Portfolio types
│   ├── message.ts          # Message types
│   ├── search.ts           # Search types
│   └── service.ts          # NEW: Service types
├── ports/
│   ├── project-repository.ts
│   ├── proposal-repository.ts
│   ├── milestone-repository.ts
│   ├── review-repository.ts
│   ├── profile-repository.ts
│   ├── portfolio-repository.ts
│   ├── payment-provider.ts
│   ├── contract-provider.ts
│   ├── ai-provider.ts
│   ├── storage-provider.ts
│   └── service-repository.ts  # NEW
├── usecases/
│   ├── project.ts
│   ├── proposal.ts
│   ├── milestone.ts
│   ├── review.ts
│   ├── creator.ts
│   ├── search.ts
│   ├── chat.ts
│   ├── profile.ts
│   ├── sow.ts
│   └── service.ts             # NEW
└── validators/
    ├── project.ts
    └── service.ts             # NEW
```

### Adapter Files
```
src/adapters/
├── db/
│   ├── schema/
│   │   ├── projects.ts
│   │   ├── profiles.ts
│   │   ├── interactions.ts
│   │   ├── feedback.ts
│   │   ├── communication.ts
│   │   ├── portfolio.ts
│   │   ├── audit.ts
│   │   └── services.ts        # NEW
│   ├── repositories/
│   │   ├── project.ts
│   │   ├── proposal.ts
│   │   ├── milestone.ts
│   │   ├── review.ts
│   │   ├── profile.ts
│   │   ├── portfolio.ts
│   │   ├── message.ts
│   │   └── service.ts         # NEW
│   └── client.ts
├── payment/
│   ├── toss.ts
│   └── dummy.ts
├── contract/
│   ├── modusign.ts
│   └── dummy.ts
├── storage/
│   ├── supabase.ts
│   └── dummy.ts
└── ai/
    ├── openai.ts
    └── dummy.ts
```

### Database Migrations
```
supabase/migrations/
├── 000_roles.sql
├── 001_schema.sql          # Current schema
├── 002_rls.sql
├── 003_functions.sql
├── 004_services.sql        # NEW: Service tables
└── 005_add_workable_type.sql # NEW: Add workable_type column
```

---

## Validation Rules Summary

### Project
- Title: 5-100 characters
- Description: 20-2000 characters
- Budget: minimum ₩10,000
- Deadline: must be in future
- Categories: 9 predefined options

### Service (Proposed)
- Title: 5-100 characters
- Description: 20-2000 characters
- Base Price: minimum ₩10,000
- Delivery Days: minimum 1 day
- Categories: 8 prede
