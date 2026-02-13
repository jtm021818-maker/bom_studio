import { eq, desc, sql, and, gte, lte, asc } from 'drizzle-orm';
import { db } from '@/adapters/db/client';
import { services, servicePackages } from '@/adapters/db/schema/services';
import type { ServiceRepository, ServiceFilters, ServiceSort } from '@/core/ports/service-repository';
import type { ServiceData, CreateServiceInput, UpdateServiceInput, ServicePackage } from '@/core/types/service';

function mapPackageRow(row: typeof servicePackages.$inferSelect): ServicePackage {
  return {
    tier: row.tier,
    title: row.title,
    description: row.description,
    price: row.price,
    deliveryDays: row.deliveryDays,
    revisions: row.revisions,
    videoLength: row.videoLength,
    features: row.features ?? [],
  };
}

function mapServiceRow(
  row: typeof services.$inferSelect,
  packages: ServicePackage[],
): ServiceData {
  return {
    id: row.id,
    creatorId: row.creatorId,
    title: row.title,
    description: row.description,
    category: row.category,
    status: row.status,
    packages,
    thumbnailUrl: row.thumbnailUrl,
    galleryUrls: row.galleryUrls ?? [],
    tags: row.tags ?? [],
    faq: (row.faq as { question: string; answer: string }[]) ?? [],
    viewCount: row.viewCount,
    orderCount: row.orderCount,
    avgRating: row.avgRating,
    reviewCount: row.reviewCount,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function findServiceWithPackages(serviceId: string): Promise<ServiceData | null> {
  const results = await db.select().from(services).where(eq(services.id, serviceId)).limit(1);
  const row = results[0];
  if (!row) return null;

  const pkgs = await db
    .select()
    .from(servicePackages)
    .where(eq(servicePackages.serviceId, serviceId))
    .orderBy(asc(servicePackages.sortOrder));

  return mapServiceRow(row, pkgs.map(mapPackageRow));
}

const TIER_SORT_ORDER: Record<string, number> = { basic: 0, standard: 1, premium: 2 };

export const serviceRepository: ServiceRepository = {
  async create(input: CreateServiceInput): Promise<ServiceData> {
    const [result] = await db
      .insert(services)
      .values({
        creatorId: input.creatorId,
        title: input.title,
        description: input.description,
        category: input.category,
        status: 'draft',
        thumbnailUrl: input.thumbnailUrl ?? '',
        galleryUrls: input.galleryUrls ?? [],
        tags: input.tags ?? [],
        faq: input.faq ?? [],
      })
      .returning();
    if (!result) throw new Error('Failed to create service');

    const pkgs: ServicePackage[] = [];
    for (const pkg of input.packages) {
      const [pkgResult] = await db
        .insert(servicePackages)
        .values({
          serviceId: result.id,
          tier: pkg.tier,
          title: pkg.title,
          description: pkg.description,
          price: pkg.price,
          deliveryDays: pkg.deliveryDays,
          revisions: pkg.revisions,
          videoLength: pkg.videoLength,
          features: pkg.features,
          sortOrder: TIER_SORT_ORDER[pkg.tier] ?? 0,
        })
        .returning();
      if (pkgResult) {
        pkgs.push(mapPackageRow(pkgResult));
      }
    }

    return mapServiceRow(result, pkgs);
  },

  async findById(id: string): Promise<ServiceData | null> {
    return findServiceWithPackages(id);
  },

  async findByCreatorId(creatorId: string): Promise<ServiceData[]> {
    const results = await db
      .select()
      .from(services)
      .where(eq(services.creatorId, creatorId))
      .orderBy(desc(services.createdAt));

    const serviceList: ServiceData[] = [];
    for (const row of results) {
      const pkgs = await db
        .select()
        .from(servicePackages)
        .where(eq(servicePackages.serviceId, row.id))
        .orderBy(asc(servicePackages.sortOrder));
      serviceList.push(mapServiceRow(row, pkgs.map(mapPackageRow)));
    }
    return serviceList;
  },

  async findByCategory(
    category: string,
    filters?: ServiceFilters,
    sort?: ServiceSort,
    pagination?: { page: number; limit: number },
  ): Promise<{ services: ServiceData[]; total: number }> {
    const conditions = [eq(services.category, category), eq(services.status, 'active')];

    if (filters?.minRating) {
      conditions.push(gte(services.avgRating, filters.minRating));
    }

    const whereClause = and(...conditions);

    // Count total
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(services)
      .where(whereClause);
    const total = Number(countResult[0]?.count ?? 0);

    // Build query
    const limit = pagination?.limit ?? 20;
    const offset = ((pagination?.page ?? 1) - 1) * limit;

    let orderBy;
    if (sort) {
      const col = sort.field === 'price' ? services.orderCount : services[sort.field];
      orderBy = sort.direction === 'asc' ? asc(col) : desc(col);
    } else {
      orderBy = desc(services.orderCount);
    }

    const results = await db
      .select()
      .from(services)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    const serviceList: ServiceData[] = [];
    for (const row of results) {
      const pkgs = await db
        .select()
        .from(servicePackages)
        .where(eq(servicePackages.serviceId, row.id))
        .orderBy(asc(servicePackages.sortOrder));
      serviceList.push(mapServiceRow(row, pkgs.map(mapPackageRow)));
    }

    return { services: serviceList, total };
  },

  async findFeatured(limit = 8): Promise<ServiceData[]> {
    const results = await db
      .select()
      .from(services)
      .where(eq(services.status, 'active'))
      .orderBy(desc(services.orderCount))
      .limit(limit);

    const serviceList: ServiceData[] = [];
    for (const row of results) {
      const pkgs = await db
        .select()
        .from(servicePackages)
        .where(eq(servicePackages.serviceId, row.id))
        .orderBy(asc(servicePackages.sortOrder));
      serviceList.push(mapServiceRow(row, pkgs.map(mapPackageRow)));
    }
    return serviceList;
  },

  async update(id: string, input: UpdateServiceInput): Promise<ServiceData> {
    const { packages: newPackages, ...fields } = input;

    const [result] = await db
      .update(services)
      .set({ ...fields, updatedAt: new Date() })
      .where(eq(services.id, id))
      .returning();
    if (!result) throw new Error('Service not found');

    if (newPackages) {
      // Delete existing packages and insert new ones
      await db.delete(servicePackages).where(eq(servicePackages.serviceId, id));
      for (const pkg of newPackages) {
        await db.insert(servicePackages).values({
          serviceId: id,
          tier: pkg.tier,
          title: pkg.title,
          description: pkg.description,
          price: pkg.price,
          deliveryDays: pkg.deliveryDays,
          revisions: pkg.revisions,
          videoLength: pkg.videoLength,
          features: pkg.features,
          sortOrder: TIER_SORT_ORDER[pkg.tier] ?? 0,
        });
      }
    }

    const service = await findServiceWithPackages(id);
    if (!service) throw new Error('Service not found after update');
    return service;
  },

  async updateStats(id: string, field: 'viewCount' | 'orderCount', increment: number): Promise<void> {
    const col = field === 'viewCount' ? services.viewCount : services.orderCount;
    await db
      .update(services)
      .set({
        [field]: sql`${col} + ${increment}`,
        updatedAt: new Date(),
      })
      .where(eq(services.id, id));
  },
};
