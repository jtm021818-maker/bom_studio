import { describe, it, expect, beforeEach } from 'vitest';
import { createDummyContractProvider } from '@/adapters/contract/dummy';
import type { ContractProvider } from '@/core/ports/contract-provider';

describe('createDummyContractProvider', () => {
  let provider: ContractProvider;

  beforeEach(() => {
    provider = createDummyContractProvider();
  });

  describe('createDocument', () => {
    it('returns document ID and signing URL', async () => {
      const result = await provider.createDocument({
        title: 'AI 영상 제작 계약서',
        content: '계약 내용...',
        signers: [
          { name: '홍길동', email: 'client@test.com', role: 'client' },
          { name: '김크리', email: 'creator@test.com', role: 'creator' },
        ],
      });

      expect(result.documentId).toMatch(/^dummy_doc_/);
      expect(result.signingUrl).toContain(result.documentId);
      expect(result.signingUrl).toContain(encodeURIComponent('AI 영상 제작 계약서'));
    });

    it('generates unique document IDs', async () => {
      const doc1 = await provider.createDocument({
        title: '계약서 1', content: '내용', signers: [
          { name: 'A', email: 'a@test.com', role: 'client' },
        ],
      });
      const doc2 = await provider.createDocument({
        title: '계약서 2', content: '내용', signers: [
          { name: 'B', email: 'b@test.com', role: 'creator' },
        ],
      });

      expect(doc1.documentId).not.toBe(doc2.documentId);
    });
  });

  describe('getDocumentStatus', () => {
    it('returns sent status for newly created document', async () => {
      const doc = await provider.createDocument({
        title: '테스트 계약서', content: '내용', signers: [
          { name: '홍길동', email: 'test@test.com', role: 'client' },
        ],
      });

      const status = await provider.getDocumentStatus(doc.documentId);

      expect(status.status).toBe('sent');
    });

    it('returns draft status for unknown document', async () => {
      const status = await provider.getDocumentStatus('nonexistent-doc-id');

      expect(status.status).toBe('draft');
    });
  });

  describe('downloadDocument', () => {
    it('returns download URL with document ID', async () => {
      const doc = await provider.createDocument({
        title: '다운로드 테스트', content: '내용', signers: [
          { name: '홍길동', email: 'test@test.com', role: 'client' },
        ],
      });

      const result = await provider.downloadDocument(doc.documentId);

      expect(result.downloadUrl).toContain(doc.documentId);
      expect(result.downloadUrl).toContain('.pdf');
    });

    it('returns URL even for unknown documents', async () => {
      const result = await provider.downloadDocument('unknown-id');

      expect(result.downloadUrl).toContain('unknown-id');
    });
  });

  describe('full contract lifecycle', () => {
    it('handles create → check status → download flow', async () => {
      // Create
      const doc = await provider.createDocument({
        title: 'AI 영상 외주 계약서',
        content: '제1조 목적\n이 계약은...',
        signers: [
          { name: '이클라', email: 'client@bomgyeol.com', role: 'client' },
          { name: '박크리', email: 'creator@bomgyeol.com', role: 'creator' },
        ],
      });
      expect(doc.documentId).toBeTruthy();
      expect(doc.signingUrl).toBeTruthy();

      // Check status
      const status = await provider.getDocumentStatus(doc.documentId);
      expect(status.status).toBe('sent');

      // Download
      const download = await provider.downloadDocument(doc.documentId);
      expect(download.downloadUrl).toContain('.pdf');
    });
  });
});
