/**
 * Search types for hybrid (hard filter + vector) search.
 */

export interface SearchCreatorsInput {
  /** Free-text query for vector similarity */
  query?: string;
  /** Hard filters */
  skills?: string[];
  availability?: 'available' | 'busy' | 'unavailable';
  /** Pagination */
  limit?: number;
  offset?: number;
}

export interface SearchCreatorsResult {
  profileId: string;
  name: string;
  intro: string;
  skills: string[];
  tools: string[];
  availability: string;
  hourlyRate: string | null;
  /** Similarity score (0-1, higher = more relevant). Null if no vector query. */
  similarity: number | null;
}

export interface SearchProjectsInput {
  query?: string;
  category?: string;
  budgetMin?: number;
  budgetMax?: number;
  limit?: number;
  offset?: number;
}

export interface SearchProjectsResult {
  id: string;
  title: string;
  description: string;
  category: string;
  budgetMin: number;
  budgetMax: number;
  deadline: Date;
  similarity: number | null;
}

export interface EmbeddingProvider {
  /** Generate embedding vector for text */
  embed(text: string): Promise<number[]>;
  /** Generate embeddings for multiple texts */
  embedBatch(texts: string[]): Promise<number[][]>;
}
