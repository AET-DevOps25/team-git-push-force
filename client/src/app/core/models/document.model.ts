export interface ProcessedDocument {
  id: string;
  filename: string;
  type: 'INDUSTRY_REPORT' | 'BRAND_DECK' | 'PAST_EVENT_DEBRIEF' | 'GUIDELINES' | 'OTHER';
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  s3Location: string;
  uploadedAt: string; // ISO date-time string per OpenAPI spec
  processedAt?: string; // ISO date-time string per OpenAPI spec
}

export interface DocumentUploadResult {
  documentId: string;
  filename: string;
  size: number;
  mimeType: string;
  uploadedAt: string; // ISO date-time string per OpenAPI spec
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
} 