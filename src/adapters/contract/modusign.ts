import type { ContractProvider } from '@/core/ports/contract-provider';

/**
 * Modusign adapter for electronic contracts.
 * Requires MODUSIGN_API_KEY environment variable.
 */
export function createModusignProvider(apiKey: string): ContractProvider {
  const baseUrl = process.env.MODUSIGN_BASE_URL ?? 'https://api.modusign.co.kr/documents';

  async function modusignRequest(path: string, body?: Record<string, unknown>) {
    const response = await fetch(`${baseUrl}${path}`, {
      method: body ? 'POST' : 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Modusign API error: ${response.status} - ${error}`);
    }

    return response.json() as Promise<Record<string, unknown>>;
  }

  return {
    async createDocument(params) {
      const data = await modusignRequest('', {
        title: params.title,
        content: params.content,
        participants: params.signers.map((s) => ({
          name: s.name,
          email: s.email,
          role: s.role === 'client' ? 'SIGNER_1' : 'SIGNER_2',
        })),
      });

      return {
        documentId: (data['id'] as string) ?? '',
        signingUrl: (data['signingUrl'] as string) ?? '',
      };
    },

    async getDocumentStatus(documentId) {
      const data = await modusignRequest(`/${documentId}`);
      return {
        status: (data['status'] as 'draft' | 'sent' | 'signed' | 'completed' | 'declined') ?? 'draft',
        signedAt: data['signedAt'] as string | undefined,
      };
    },

    async downloadDocument(documentId) {
      const data = await modusignRequest(`/${documentId}/download`);
      return {
        downloadUrl: (data['downloadUrl'] as string) ?? '',
      };
    },
  };
}
