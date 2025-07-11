export interface ProcessedDocument {
  id: string;
  filename: string;
  type: 'INDUSTRY_REPORT' | 'BRAND_DECK' | 'PAST_EVENT_DEBRIEF' | 'GUIDELINES' | 'OTHER';
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  s3Location: string;
  uploadedAt: Date;
  processedAt?: Date;
}

export interface DocumentUploadResult {
  documentId: string;
  filename: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
} 