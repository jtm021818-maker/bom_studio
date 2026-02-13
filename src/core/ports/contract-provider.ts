/**
 * Port for electronic contract operations (Modusign).
 */
export interface ContractProvider {
  /** Create a contract document and return the signing URL */
  createDocument(params: {
    title: string;
    content: string;
    signers: Array<{
      name: string;
      email: string;
      role: 'client' | 'creator';
    }>;
  }): Promise<{ documentId: string; signingUrl: string }>;

  /** Check document signing status */
  getDocumentStatus(documentId: string): Promise<{
    status: 'draft' | 'sent' | 'signed' | 'completed' | 'declined';
    signedAt?: string;
  }>;

  /** Download signed document */
  downloadDocument(documentId: string): Promise<{ downloadUrl: string }>;
}
