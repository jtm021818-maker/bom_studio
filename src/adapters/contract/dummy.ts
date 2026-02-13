import type { ContractProvider } from '@/core/ports/contract-provider';

/**
 * Dummy contract provider for development.
 */
export function createDummyContractProvider(): ContractProvider {
  const documents = new Map<string, {
    status: 'draft' | 'sent' | 'signed' | 'completed' | 'declined';
    signedAt?: string;
  }>();

  return {
    async createDocument(params) {
      const documentId = `dummy_doc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      documents.set(documentId, { status: 'sent' });

      return {
        documentId,
        signingUrl: `https://dummy-modusign.local/sign/${documentId}?title=${encodeURIComponent(params.title)}`,
      };
    },

    async getDocumentStatus(documentId) {
      const doc = documents.get(documentId);
      if (!doc) {
        return { status: 'draft' as const };
      }
      return {
        status: doc.status,
        signedAt: doc.signedAt,
      };
    },

    async downloadDocument(documentId) {
      return {
        downloadUrl: `https://dummy-modusign.local/download/${documentId}.pdf`,
      };
    },
  };
}
