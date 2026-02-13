# Architecture Quick Reference

## Current Domain Model (Project-Based Marketplace)

```
┌─────────────────────────────────────────────────────────────────┐
│                         MARKETPLACE                              │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    PROFILES (Users)                       │   │
│  │  ┌─────────────┐  ┌──────────────────┐                   │   │
│  │  │  Profile    │  │ CreatorProfile   │                   │   │
│  │  │ (client/    │  │ (skills, tools,  │                   │   │
│  │  │  creator)   │  │  availability)   │                   │   │
│  │  └─────────────┘  └──────────────────┘                   │   │
│  │                          │                                │   │
│  │                    ┌─────▼──────┐                         │   │
│  │                    │ Portfolio   │                         │   │
│  │                    │ (items)     │                         │   │
│  │                    └─────────────┘                         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    PROJECT DOMAIN                         │   │
│  │  ┌──────────────┐                                         │   │
│  │  │  Project     │ (client-initiated)                      │   │
│  │  │ (title, desc,│                                         │   │
│  │  │  budget,     │                                         │   │
│  │  │  deadline)   │                                         │   │
│  │  └──────┬───────┘                                         │   │
│  │         │                                                 │   │
│  │    ┌────▼──────────────────────────────────┐             │   │
│  │    │  VideoBrief (channel, duration, fps)  │             │   │
│  │    │  Storyboard (scenes)                  │             │   │
│  │    │  Shotlist (shots)                     │             │   │
│  │    └────────────────────────────────────────┘             │   │
│  │                                                            │   │
│  │  ┌──────────────┐                                         │   │
│  │  │  Proposal    │ (creator bids)                          │   │
│  │  │ (price,      │                                         │   │
│  │  │  delivery)   │                                         │   │
│  │  └──────┬───────┘                                         │   │
│  │         │                                                 │   │
│  │    ┌────▼──────────────────────────────────┐             │   │
│  │    │  Contract (signed agreement)          │             │   │
│  │    │  Milestone (deliverable checkpoint)   │             │   │
│  │    │  Delivery (actual deliverable)        │             │   │
│  │    │  Payment (escrow)                     │             │   │
│  │    └────────────────────────────────────────┘             │   │
│  │                                                            │   │
│  │  ┌──────────────┐  ┌──────────────┐                       │   │
│  │  │  Message     │  │  Review      │                       │   │
│  │  │  (chat)      │  │  (rating)    │                       │   │
│  │  └──────────────┘  └──────────────┘                       │   │
│  │                                                            │   │
│  │  ┌──────────────┐                                         │   │
│  │  │  Dispute     │                                         │   │
│  │  │  (conflict)  │                                         │   │
│  │  └──────────────┘                                         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow: Project Lifecycle

```
1. CLIENT CREATES PROJECT
   ├─ Project (draft)
   ├─ VideoBrief (specs)
   ├─ Storyboard (scenes)
   └─ Shotlist (shots)
        │
        ▼
2. PROJECT PUBLISHED
   └─ Project (open)
        │
        ▼
3. CREATORS SUBMIT PROPOSALS
   ├─ Proposal (pending)
   │   ├─ price >= ₩10,000
   │   └─ delivery_days >= 1
        │
        ▼
4. CLIENT ACCEPTS PROPOSAL
   ├─ Proposal (accepted)
   ├─ Contract (created)
   └─ Project (in_progress)
        │
        ▼
5. MILESTONES & PAYMENTS
   ├─ Milestone (pending)
   ├─ Payment (pending → escrowed)
   │   └─ Toss Payments escrow
        │
        ▼
6. CREATOR SUBMITS DELIVERY
   ├─ Delivery (submitted)
   └─ Milestone (submitted)
        │
        ▼
7. CLIENT REVIEWS & APPROVES
   ├─ Milestone (approved)
   ├─ Payment (released)
   └─ Project (review → completed)
        │
        ▼
8. POST-PROJECT
   ├─ Review (rating + comment)
   ├─ Dispute (if needed)
   └─ Project (completed)
```

## Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│                    API ROUTES                            │
│  (Next.js /app/api/*)                                   │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                   USECASES                               │
│  (src/core/usecases/*)                                  │
│  - project.ts                                           │
│  - proposal.ts                                          │
│  - milestone.ts                                         │
│  - review.ts                                            │
│  - creator.ts                                           │
│  - search.ts                                            │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                   PORTS (Interfaces)                     │
│  (src/core/ports/*)                                     │
│  - ProjectRepository                                    │
│  - ProposalRepository                                   │
│  - MilestoneRepository                                  │
│  - ReviewRepository                                     │
│  - PaymentProvider                                      │
│  - ContractProvider                                     │
│  - EmbeddingProvider                                    │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                  ADAPTERS                                │
│  (src/adapters/*)                                       │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Database (Drizzle ORM)                           │   │
│  │ - repositories/project.ts                        │   │
│  │ - repositories/proposal.ts                       │   │
│  │ - schema/projects.ts                             │   │
│  │ - schema/interactions.ts                         │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │ External Services                                │   │
│  │ - payment/toss.ts (Toss Payments)                │   │
│  │ - contract/modusign.ts (Modusign)                │   │
│  │ - storage/supabase.ts (Supabase Storage)         │   │
│  │ - ai/openai.ts (OpenAI embeddings)               │   │
│  └──────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│              EXTERNAL SYSTEMS                            │
│  - Supabase PostgreSQL (Database)                       │
│  - Supabase Storage (File storage)                      │
│  - Toss Payments (Payment escrow)                       │
│  - Modusign (E-signature)                               │
│  - OpenAI (Embeddings)            
