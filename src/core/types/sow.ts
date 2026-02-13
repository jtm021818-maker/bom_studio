/**
 * SOW (Statement of Work) types for AI-generated project scope documents.
 */

export interface SowData {
  id: string;
  projectId: string;
  content: string;
  version: number;
  generatedAt: Date;
}

export interface SowGenerationInput {
  projectTitle: string;
  projectDescription: string;
  category: string;
  budgetMin: number;
  budgetMax: number;
  deadline: string;
  videoBrief?: {
    channel: string;
    duration: string;
    resolution: string;
    aspectRatio: string;
    fps: string;
    style: string;
    prohibitedElements?: string[];
    referenceUrls?: string[];
  };
}
