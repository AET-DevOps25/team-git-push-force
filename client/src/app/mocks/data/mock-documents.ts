import { ProcessedDocument, DocumentUploadResult } from '../../core/models/document.model';

export const MOCK_DOCUMENTS: ProcessedDocument[] = [
  {
    id: 'doc-1',
    filename: 'AI_Conference_Best_Practices.pdf',
    type: 'GUIDELINES',
    status: 'COMPLETED',
    s3Location: 's3://concepter-docs/user-1/concept-1/AI_Conference_Best_Practices.pdf',
    uploadedAt: '2024-01-10T09:30:00Z',
    processedAt: '2024-01-10T09:35:00Z'
  },
  {
    id: 'doc-2',
    filename: 'Sustainability_Framework_2024.docx',
    type: 'INDUSTRY_REPORT',
    status: 'COMPLETED',
    s3Location: 's3://concepter-docs/user-2/concept-2/Sustainability_Framework_2024.docx',
    uploadedAt: '2024-01-12T11:15:00Z',
    processedAt: '2024-01-12T11:22:00Z'
  },
  {
    id: 'doc-3',
    filename: 'Digital_Marketing_Trends_2024.pdf',
    type: 'INDUSTRY_REPORT',
    status: 'PROCESSING',
    s3Location: 's3://concepter-docs/user-3/concept-3/Digital_Marketing_Trends_2024.pdf',
    uploadedAt: '2024-01-08T16:45:00Z'
  },
  {
    id: 'doc-4',
    filename: 'Event_Planning_Checklist.txt',
    type: 'GUIDELINES',
    status: 'FAILED',
    s3Location: 's3://concepter-docs/user-1/concept-1/Event_Planning_Checklist.txt',
    uploadedAt: '2024-01-14T13:20:00Z'
  },
  {
    id: 'doc-5',
    filename: 'Past_Conference_Report.pdf',
    type: 'PAST_EVENT_DEBRIEF',
    status: 'COMPLETED',
    s3Location: 's3://concepter-docs/user-1/concept-1/Past_Conference_Report.pdf',
    uploadedAt: '2024-01-11T10:00:00Z',
    processedAt: '2024-01-11T10:08:00Z'
  },
  {
    id: 'doc-6',
    filename: 'Brand_Guidelines.pdf',
    type: 'BRAND_DECK',
    status: 'COMPLETED',
    s3Location: 's3://concepter-docs/user-2/concept-2/Brand_Guidelines.pdf',
    uploadedAt: '2024-01-13T14:30:00Z',
    processedAt: '2024-01-13T14:35:00Z'
  }
];

// Removed MOCK_UPLOAD_RESULTS as it was unused

// Helper functions for document mocking
export const generateMockUploadResult = (file: File): DocumentUploadResult => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain'
  ];

  // Simulate validation but always return a successful result for demo
  return {
    documentId: `doc-${Date.now()}`,
    filename: file.name,
    size: file.size,
    mimeType: file.type,
    uploadedAt: new Date().toISOString(),
    status: 'QUEUED'
  };
};

export const getDocumentsByStatus = (status: 'PROCESSING' | 'COMPLETED' | 'FAILED'): ProcessedDocument[] => {
  return MOCK_DOCUMENTS.filter(doc => doc.status === status);
};

export const getDocumentsByType = (type: 'INDUSTRY_REPORT' | 'BRAND_DECK' | 'PAST_EVENT_DEBRIEF' | 'GUIDELINES' | 'OTHER'): ProcessedDocument[] => {
  return MOCK_DOCUMENTS.filter(doc => doc.type === type);
}; 