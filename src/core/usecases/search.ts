import { sql } from 'drizzle-orm';
import { db } from '@/adapters/db/client';
import type { EmbeddingProvider, SearchCreatorsInput, SearchCreatorsResult, SearchProjectsInput, SearchProjectsResult } from '@/core/types/search';

/**
 * Hybrid search use cases.
 * Strategy: WHERE hard-filters + ORDER BY vector similarity
 * (NOT RRF — per project constraints)
 */
export function createSearchUseCases(embeddingProvider: EmbeddingProvider) {
  return {
    /**
     * Search creators: hard filter by skills/availability + vector ORDER BY.
     */
    async searchCreators(input: SearchCreatorsInput): Promise<SearchCreatorsResult[]> {
      const limit = input.limit ?? 20;
      const offset = input.offset ?? 0;

      // Build WHERE conditions
      const conditions: string[] = ['cp.deleted_at IS NULL', 'p.deleted_at IS NULL'];

      if (input.availability) {
        conditions.push(`cp.availability = '${input.availability}'`);
      }

      if (input.skills && input.skills.length > 0) {
        // Hard filter: creator must have at least one matching skill
        const skillConditions = input.skills.map((s) => `'${s.replace(/'/g, "''")}' = ANY(cp.skills)`);
        conditions.push(`(${skillConditions.join(' OR ')})`);
      }

      const whereClause = conditions.join(' AND ');

      // If query provided, use vector similarity ordering
      if (input.query) {
        const queryEmbedding = await embeddingProvider.embed(input.query);
        const embeddingStr = `[${queryEmbedding.join(',')}]`;

        const results = await db.execute(sql.raw(`
          SELECT
            p.id as profile_id,
            p.name,
            cp.intro,
            cp.skills,
            cp.tools,
            cp.availability,
            cp.hourly_rate,
            1 - (cp.embedding <=> '${embeddingStr}'::vector) as similarity
          FROM creator_profiles cp
          JOIN profiles p ON p.id = cp.profile_id
          WHERE ${whereClause}
            AND cp.embedding IS NOT NULL
          ORDER BY cp.embedding <=> '${embeddingStr}'::vector
          LIMIT ${limit} OFFSET ${offset}
        `));

        return (results.rows as Record<string, unknown>[]).map((row) => ({
          profileId: row['profile_id'] as string,
          name: row['name'] as string,
          intro: row['intro'] as string,
          skills: row['skills'] as string[],
          tools: row['tools'] as string[],
          availability: row['availability'] as string,
          hourlyRate: row['hourly_rate'] as string | null,
          similarity: row['similarity'] as number | null,
        }));
      }

      // No query — just hard filters, ordered by creation
      const results = await db.execute(sql.raw(`
        SELECT
          p.id as profile_id,
          p.name,
          cp.intro,
          cp.skills,
          cp.tools,
          cp.availability,
          cp.hourly_rate,
          NULL as similarity
        FROM creator_profiles cp
        JOIN profiles p ON p.id = cp.profile_id
        WHERE ${whereClause}
        ORDER BY cp.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `));

      return (results.rows as Record<string, unknown>[]).map((row) => ({
        profileId: row['profile_id'] as string,
        name: row['name'] as string,
        intro: row['intro'] as string,
        skills: row['skills'] as string[],
        tools: row['tools'] as string[],
        availability: row['availability'] as string,
        hourlyRate: row['hourly_rate'] as string | null,
        similarity: null,
      }));
    },

    /**
     * Search projects: hard filter by category/budget + vector ORDER BY.
     */
    async searchProjects(input: SearchProjectsInput): Promise<SearchProjectsResult[]> {
      const limit = input.limit ?? 20;
      const offset = input.offset ?? 0;

      const conditions: string[] = ['p.deleted_at IS NULL', "p.status = 'open'"];

      if (input.category) {
        conditions.push(`p.category = '${input.category.replace(/'/g, "''")}'`);
      }
      if (input.budgetMin !== undefined) {
        conditions.push(`p.budget_max >= ${input.budgetMin}`);
      }
      if (input.budgetMax !== undefined) {
        conditions.push(`p.budget_min <= ${input.budgetMax}`);
      }

      const whereClause = conditions.join(' AND ');

      if (input.query) {
        const queryEmbedding = await embeddingProvider.embed(input.query);
        const embeddingStr = `[${queryEmbedding.join(',')}]`;

        const results = await db.execute(sql.raw(`
          SELECT
            p.id,
            p.title,
            p.description,
            p.category,
            p.budget_min,
            p.budget_max,
            p.deadline,
            1 - (vb.embedding <=> '${embeddingStr}'::vector) as similarity
          FROM projects p
          LEFT JOIN video_briefs vb ON vb.project_id = p.id
          WHERE ${whereClause}
            AND vb.embedding IS NOT NULL
          ORDER BY vb.embedding <=> '${embeddingStr}'::vector
          LIMIT ${limit} OFFSET ${offset}
        `));

        return (results.rows as Record<string, unknown>[]).map((row) => ({
          id: row['id'] as string,
          title: row['title'] as string,
          description: row['description'] as string,
          category: row['category'] as string,
          budgetMin: row['budget_min'] as number,
          budgetMax: row['budget_max'] as number,
          deadline: new Date(row['deadline'] as string),
          similarity: row['similarity'] as number | null,
        }));
      }

      const results = await db.execute(sql.raw(`
        SELECT
          p.id,
          p.title,
          p.description,
          p.category,
          p.budget_min,
          p.budget_max,
          p.deadline,
          NULL as similarity
        FROM projects p
        WHERE ${whereClause}
        ORDER BY p.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `));

      return (results.rows as Record<string, unknown>[]).map((row) => ({
        id: row['id'] as string,
        title: row['title'] as string,
        description: row['description'] as string,
        category: row['category'] as string,
        budgetMin: row['budget_min'] as number,
        budgetMax: row['budget_max'] as number,
        deadline: new Date(row['deadline'] as string),
        similarity: null,
      }));
    },
  };
}
