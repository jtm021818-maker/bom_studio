# Marketplace Database Schema & Domain Architecture Analysis

## Executive Summary

This is a **Project-based Marketplace** for AI video creation services. The current architecture is tightly coupled to the "Project" domain with specialized entities for video production (VideoBrief, Storyboard, Shotlist). To add a "Service/Gig" domain, significant refactoring is needed to extract common patterns.

---

## 1. DATABASE SCHEMA OVERVIEW

### Core Tables (Supabase PostgreSQL)

#### User & Profile Management
- **profiles** — Base user profile (client/creator/admin)
  - Links to Better Auth user table via `user_id`
  - Fields: id, user_id, name, email, role, avatar, bio, timestamps
  
- **creator_profiles** — Creator-specific data
  - Fields: id, profile_id, intro, skills[], tools[], availability, hourly_rate, portfolio_url, embedding (1536-dim vector)
  - AI embedding for hybrid search

#### Project Domain (Current)
- **projects** — Main project entity
  - Fields: id, client_id, title, description, status, budget_min, budget_max, deadline, category
  - Status enum: draft → open → in_progress → review → completed → cancelled
  - Category: short_form, long_form, music_video, ad_commercial, explainer, motion_graphics, vfx, ai_art, other

- **video_briefs** — Project-specific video specifications
  - Fields: id, project_id, channel, duration, resolution, aspect_ratio, fps, style, prohibited_elements[], reference_urls[], embedding
  - Channel enum: youtube_short, youtube_long, instagram_reel, tiktok, other
  - AI embedding for matching creators to projects

- **storyboard_items** — Scene-by-scene breakdown
  - Fields: id, project_id, scene_number, description, goal, reference, review_status
  - Review status: pending → approved → revision_requested

- **shotlist_items** — Shot-level technical specs
  - Fields: id, project_id, shot_number, camera, motion, effects, duration, reference

#### Proposal & Contract Management
- **proposals** — Creator bids on projects
  - Fields: id, project_id, creator_id, delivery_days, milestones, revision_scope, price, status
  - Status: pending → accepted → rejected
  - Validation: price >= ₩10,000, delivery_days >= 1

- **contracts** — Signed agreements
  - Fields: id, project_id, proposal_id, client_id, creator_id, terms, signed_at, modusign_document_id
  - Integrates with Modusign for e-signature

#### Milestone & Payment Management
- **milestones** — Deliverable checkpoints
  - Fields: id, project_id, title, description, amount, due_date, status
  - Status: pending → submitted → approved → revision_requested → completed
  - Amount is in KRW (₩)

- **deliveries** — Actual deliverables submitted
  - Fields: id, milestone_id, file_url, has_watermark, submitted_at
  - Linked to Supabase Storage

- **payments** — Escrow payment tracking
  - Fields: id, milestone_id, amount, status, toss_payment_key
  - Status: pending → escrowed → released → refunded
  - Integrates with Toss Payments for escrow

#### Communication
- **messages** — Project-scoped chat
  - Fields: id, project_id, sender_id, content, timestamps
  - Polling-based (5s interval), NOT WebSocket

- **attachments** — Message file attachments
  - Fields: id, message_id, file_url, file_name, file_size

#### Quality & Disputes
- **reviews** — Post-project ratings
  - Fields: id, project_id, reviewer_id, reviewee_id, rating (1-5), comment
  - Validation: rating 1-5, comment required

- **disputes** — Conflict resolution
  - Fields: id, project_id, raised_by, reason, evidence[], status
  - Status: open → investigating → resolved → closed

#### Audit
- **embeddings_audit** — Vector generation tracking
  - Fields: id, entity_type, entity_id, embedding_model, generated_at
  - Tracks which embeddings were generated when

---

## 2. DOMAIN TYPES (TypeScript Interfaces)

### Profile Domain
```typescript
ProfileData {
  id, userId, name, email, role, avatar, bio
}

CreatorProfileData {
  id, profileId, intro, skills[], tools[], availability, hourlyRate, portfolioUrl
}

PortfolioItemData {
  id, creatorProfileId, title, description, fileUrl, thumbnailUrl, mediaType, sortOrder
}
```

### Project Domain
```typescript
ProjectData {
  id, clientId, title, description, status, budgetMin, budgetMax, deadline, category
}

VideoBriefData {
  id, projectId, channel, duration, resolution, aspectRatio, fps, style, prohibitedElements[], referenceUrls[]
}
```

### Proposal & Contract
```typescript
ProposalData {
  id, projectId, creatorId, deliveryDays, milestones, revisionScope, price, status
}
```

### Milestone & Delivery
```typescript
MilestoneData {
  id, projectId, title, description, amount, dueDate, status
}

DeliveryData {
  id, milestoneId, fileUrl, hasWatermark, submittedAt
}
```

### Review & Dispute
```typescript
ReviewData {
  id, projectId, reviewerId, revieweeId, rating, comment
}

DisputeData {
  id, projectId, raisedBy, reason, evidence[], status
}
```

### Message
```typescript
MessageData {
  id, projectId, senderId, senderName, content, createdAt
}
```

---

## 3. CATEGORY SYSTEM

### PROJECT_CATEGORIES (Hardcoded in validator)
```typescript
[
  { value: 'short_form', label: '숏폼 (60초 이하)' },
  { value: 'long_form', label: '롱폼 (60초 이상)' },
  { value: 'music_video', label: '뮤직비디오' },
  { value: 'ad_commercial', label: '광고/커머셜' },
  { value: 'explainer', label: '설명 영상' },
  { value: 'motion_graphics', label: '모션그래픽' },
  { value: 'vfx', label: 'VFX/특수효과' },
  { value: 'ai_art', label: 'AI 아트' },
  { value: 'other', label: '기타' },
]
```

### CHANNEL_LABELS (Video distribution channels)
```typescript
{
  youtube_short: '유튜브 숏츠',
  youtube_long: '유튜브 (롱폼)',
  instagram_reel: '인스타그램 릴스',
  tiktok: '틱톡',
  other: '기타',
}
```

---

## 4. PRICING & COMMISSION LOGIC

### Current Implementation
**Location**: `src/core/usecases/proposal.ts`

```typescript
if (input.price < 10000) {
  throw new Error('제안 금액은 ₩10,000 이상이어야 합니다.');
}
if (input.deliveryDays < 1) {
  throw new Error('납품 기간은 최소 1일 이상이어야 합니다.');
}
```

### Observations
- **Minimum price**: ₩10,000 (hardcoded)
- **No commission logic implemented** — Only validation exists
- **No pricing tiers** — Flat minimum
- **No dynamic pricing** — Based on category, complexity, or creator tier
- **Milestone-based payments** — Amount stored per milestone, not calculated

---

## 5. PORT INTERFACES (Dependency Injection)

### Repository Ports
```typescript
ProfileRepository {
  findById(id), findByUserId(userId), create(), update()
}

ProjectRepository {
  findById(id), findByClientId(clientId), findOpen(limit), create(), update()
}

ProposalRepository {
  findById(id), findByProjectId(projectId), findByCreatorId(creatorId), create(), update()
}

MilestoneRepository {
  findById(id), findByProjectId(projectId), create(), update()
}

ReviewRepository {
  findByProjectId(projectId), findByRevieweeId(revieweeId), create()
}

DisputeRepository {
  findById(id), findByProjectId(projectId), create(), updateStatus()
}

PortfolioRepository {
  findByCreatorProfileId(creatorProfileId), findById(id), create(), update(), delete()
}
```

### Provider Ports
```typescript
PaymentProvider {
  createEscrow(orderId, amount, orderName, customerName, successUrl, failUrl)
  confirmPayment(paymentKey, orderId, amount)
  releaseEscrow(paymentKey)
  refundEscrow(paymentKey, reason)
}

ContractProvider {
  createDocument(title, content, signers[])
  getDocumentStatus(documentId)
  downloadDocument(documentId)
}

EmbeddingProvider {
  embed(text): Promise<number[]>
  embedBatch(texts[]): Promise<number[][]>
}
```

---

## 6. USECASE IMPLEMENTATIONS

### Project Usecases
```typescript
createProjectUseCases(projectRepo, videoBriefRepo) {
  getProject(id)
  listClientProjects(clientId)
  listOpenProjects(limit)
  createProject(input)
  updateProject(id, input)
  publishProject(id)
  getVideoBrief(projectId)
  createVideoBrief(input)
  updateVideoBrief(id, input)
}
```

### Proposal Usecases
```typescript
createProposalUseCases(proposalRepo) {
  getProposal(id)
  listByProject(projectId)
  listByCreator(creatorId)
  createProposal(input) // Validates p
