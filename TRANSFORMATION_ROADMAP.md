# Marketplace Transformation Roadmap: Adding Service/Gig Domain

## Overview
This document outlines the step-by-step plan to add a "Service/Gig" domain alongside the existing "Project" domain in the marketplace.

---

## Phase 1: Analysis & Planning (Current)

### Completed
- [x] Database schema analysis
- [x] Domain type mapping
- [x] Port interface review
- [x] Usecase implementation analysis
- [x] Category system review
- [x] Pricing logic review

### Deliverables
- [x] MARKETPLACE_TRANSFORMATION_ANALYSIS.md
- [x] ARCHITECTURE_QUICK_REFERENCE.md
- [x] TRANSFORMATION_ROADMAP.md (this file)

---

## Phase 2: Abstraction Layer (2-3 weeks)

### Goal
Extract common patterns from Project domain to support multiple work types.

### Tasks

#### 2.1 Create Generic Workable Interface
**File**: `src/core/types/workable.ts`

```typescript
export interface Workable {
  id: string;
  clientId: string;
  creatorId?: string; // For services, known upfront
  title: string;
  description: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export type WorkableType = 'project' | 'service';
```

**Impact**: Low - New file, no breaking changes

#### 2.2 Create Generic Repository Interfaces
**Files**: 
- `src/core/ports/workable-repository.ts`
- `src/core/ports/generic-proposal-repository.ts`
- `src/core/ports/generic-milestone-repository.ts`

```typescript
export interface WorkableRepository<T extends Workable> {
  findById(id: string): Promise<T | null>;
  findByClientId(clientId: string): Promise<T[]>;
  create(input: CreateWorkableInput): Promise<T>;
  update(id: string, input: UpdateWorkableInput): Promise<T>;
}

export interface GenericProposalRepository {
  findByWorkableId(workableId: string, workableType: WorkableType): Promise<ProposalData[]>;
  findByCreatorId(creatorId: string): Promise<ProposalData[]>;
  create(input: CreateProposalInput): Promise<ProposalData>;
  update(id: string, input: UpdateProposalInput): Promise<ProposalData>;
}
```

**Impact**: Medium - Extends existing interfaces, maintains backward compatibility

#### 2.3 Update Message Repository
**File**: `src/core/ports/message-repository.ts`

```typescript
export interface MessageRepository {
  findByWorkableId(workableId: string, workableType: WorkableType): Promise<MessageData[]>;
  create(input: CreateMessageInput): Promise<MessageData>;
}
```

**Impact**: Medium - Adds workableType parameter

#### 2.4 Update Review Repository
**File**: `src/core/ports/review-repository.ts`

```typescript
export interface ReviewRepository {
  findByWorkableId(workableId: string, workableType: WorkableType): Promise<ReviewData[]>;
  findByRevieweeId(revieweeId: string): Promise<ReviewData[]>;
  create(input: CreateReviewInput): Promise<ReviewData>;
}
```

**Impact**: Medium - Adds workableType parameter

#### 2.5 Update Dispute Repository
**File**: `src/core/ports/review-repository.ts`

```typescript
export interface DisputeRepository {
  findByWorkableId(workableId: string, workableType: WorkableType): Promise<DisputeData[]>;
  create(input: CreateDisputeInput): Promise<DisputeData>;
  updateStatus(id: string, status: DisputeStatus): Promise<DisputeData>;
}
```

**Impact**: Medium - Adds workableType parameter

### Testing
- Unit tests for new interfaces
- Backward compatibility tests for existing code

### Rollout
- Create feature branch: `feature/abstraction-layer`
- PR review with architecture team
- Merge to main after approval

---

## Phase 3: Service Domain Implementation (3-4 weeks)

### Goal
Implement the Service/Gig domain with full CRUD operations.

### Tasks

#### 3.1 Create Service Domain Types
**File**: `src/core/types/service.ts`

```typescript
export type ServiceStatus = 'draft' | 'published' | 'archived';

export interface ServiceData {
  id: string;
  creatorId: string;
  title: string;
  description: string;
  category: string;
  basePrice: number;
  deliveryDays: number;
  status: ServiceStatus;
  embedding?: number[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceTierData {
  id: string;
  serviceId: string;
  name: string;
  price: number;
  deliveryDays: number;
  features: string[];
  createdAt: Date;
}

export interface ServiceOrderData {
  id: string;
  serviceId: string;
  clientId: string;
  tierId?: string;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateServiceInput {
  creatorId: string;
  title: string;
  description: string;
  category: string;
  basePrice: number;
  deliveryDays: number;
}

export interface UpdateServiceInput {
  title?: string;
  description?: string;
  category?: string;
  basePrice?: number;
  deliveryDays?: number;
  status?: ServiceStatus;
}
```

**Impact**: Low - New file

#### 3.2 Create Service Repository Ports
**File**: `src/core/ports/service-repository.ts`

```typescript
export interface ServiceRepository {
  findById(id: string): Promise<ServiceData | null>;
  findByCreatorId(creatorId: string): Promise<ServiceData[]>;
  findPublished(limit?: number): Promise<ServiceData[]>;
  create(input: CreateServiceInput): Promise<ServiceData>;
  update(id: string, input: UpdateServiceInput): Promise<ServiceData>;
}

export interface ServiceTierRepository {
  findByServiceId(serviceId: string): Promise<ServiceTierData[]>;
  findById(id: string): Promise<ServiceTierData | null>;
  create(input: CreateServiceTierInput): Promise<ServiceTierData>;
  update(id: string, input: UpdateServiceTierInput): Promise<ServiceTierData>;
  delete(id: string): Promise<void>;
}

export interface ServiceOrderRepository {
  findById(id: string): Promise<ServiceOrderData | null>;
  findByClientId(clientId: string): Promise<ServiceOrderData[]>;
  findByCreatorId(creatorId: string): Promise<ServiceOrderData[]>;
  create(input: CreateServiceOrderInput): Promise<ServiceOrderData>;
  update(id: string, input: UpdateServiceOrderInput): Promise<ServiceOrderData>;
}
```

**Impact**: Low - New file

#### 3.3 Create Service Database Schema
**File**: `src/adapters/db/schema/services.ts`

```typescript
import { pgTable, uuid, text, timestamp, integer, pgEnum } from 'drizzle-orm/pg-core';
import { profiles } from './profiles';

export const serviceStatusEnum = pgEnum('service_status', [
  'draft',
  'published',
  'archived',
]);

export const services = pgTable('services', {
  id: uuid('id').primaryKey().defaultRandom(),
  creatorId: uuid('creator_id').references(() => profiles.id).notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  category: text('category').notNull(),
  basePrice: integer('base_price').notNull(),
  deliveryDays: integer('delivery_days').notNull(),
  status: serviceStatusEnum('status').notNull().default('draft'),
  embedding: vector('embedding', { dimensions: 1536 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

export const serviceTiers = pgTable('service_tiers', {
  id: uuid('id').primaryKey().defaultRandom(),
  serviceId: uuid('service_id').references(() => services.id).notNull(),
  name: text('name').notNull(),
  price: integer('price').notNull(),
  deliveryDays: integer('delivery_days').notNull(),
  features: text('features').array().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const serviceOrders = pgTable('service_orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  serviceId: uuid('service_id').references(() => services.id).notNull(),
  clientId: uuid('client_id').references(() => profiles.id).notNull(),
  tierId: uuid('tier_id').references(() => serviceTiers.id),
  status: text('status').notNull().default('pending'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});
```

**Impact**: Low - New file, requires migration

#### 3.4 Create Service Repositories (Adapters)
**File**: `src/adapters/db/repositories/service.ts`
