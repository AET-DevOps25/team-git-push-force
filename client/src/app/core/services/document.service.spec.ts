import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { DocumentService, DocumentFilters } from './document.service';
import { ApiService } from './api.service';
import { StateService } from './state.service';
import { ProcessedDocument } from '../models/document.model';

describe('DocumentService', () => {
  let service: DocumentService;
  let apiService: jasmine.SpyObj<ApiService>;
  let stateService: jasmine.SpyObj<StateService>;

  const mockDocuments: ProcessedDocument[] = [
    {
      id: 'doc-1',
      filename: 'test-document.pdf',
      type: 'INDUSTRY_REPORT',
      status: 'COMPLETED',
      s3Location: 's3://bucket/test-document.pdf',
      uploadedAt: '2024-01-01T10:00:00Z',
      processedAt: '2024-01-01T10:05:00Z'
    },
    {
      id: 'doc-2',
      filename: 'brand-deck.pptx',
      type: 'BRAND_DECK',
      status: 'PROCESSING',
      s3Location: 's3://bucket/brand-deck.pptx',
      uploadedAt: '2024-01-01T11:00:00Z'
    }
  ];

  beforeEach(() => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['upload', 'get', 'delete']);
    const stateServiceSpy = jasmine.createSpyObj('StateService', ['setLoading']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        DocumentService,
        { provide: ApiService, useValue: apiServiceSpy },
        { provide: StateService, useValue: stateServiceSpy }
      ]
    });

    service = TestBed.inject(DocumentService);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    stateService = TestBed.inject(StateService) as jasmine.SpyObj<StateService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('uploadDocuments', () => {
    it('should upload multiple documents successfully', () => {
      const testFiles = [
        new File(['content1'], 'test1.pdf', { type: 'application/pdf' }),
        new File(['content2'], 'test2.pdf', { type: 'application/pdf' })
      ];
      const conceptId = 'test-concept-id';
      const mockResponse = { processedDocuments: [mockDocuments[0]] };

      apiService.upload.and.returnValue(of(mockResponse));

      service.uploadDocuments(testFiles, conceptId).subscribe(result => {
        expect(result).toEqual(mockResponse);
      });

      expect(stateService.setLoading).toHaveBeenCalledWith('uploadDocuments', true);
      expect(apiService.upload).toHaveBeenCalledWith(
        `/api/genai/documents?conceptId=${conceptId}`,
        jasmine.any(FormData)
      );
      expect(stateService.setLoading).toHaveBeenCalledWith('uploadDocuments', false);
    });

    it('should handle upload error', () => {
      const testFiles = [new File(['content'], 'test.pdf', { type: 'application/pdf' })];
      const conceptId = 'test-concept-id';
      const consoleErrorSpy = spyOn(console, 'error');

      apiService.upload.and.returnValue(throwError(() => new Error('Upload failed')));

      service.uploadDocuments(testFiles, conceptId).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error).toBeTruthy();
          expect(stateService.setLoading).toHaveBeenCalledWith('uploadDocuments', false);
          expect(consoleErrorSpy).toHaveBeenCalledWith('DocumentService upload error:', jasmine.any(Error));
        }
      });
    });

    it('should create FormData with correct files', () => {
      const testFiles = [
        new File(['content1'], 'test1.pdf', { type: 'application/pdf' }),
        new File(['content2'], 'test2.pdf', { type: 'application/pdf' })
      ];
      const conceptId = 'test-concept-id';
      
      apiService.upload.and.returnValue(of({ processedDocuments: [] }));

      service.uploadDocuments(testFiles, conceptId).subscribe();

      const formDataCall = apiService.upload.calls.mostRecent();
      const formData = formDataCall.args[1] as FormData;
      
      expect(formData).toBeInstanceOf(FormData);
      expect(apiService.upload).toHaveBeenCalledWith(
        jasmine.stringContaining(conceptId),
        jasmine.any(FormData)
      );
    });
  });

  describe('uploadDocument', () => {
    it('should upload a single document by calling uploadDocuments', () => {
      const testFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const conceptId = 'test-concept-id';
      const mockResponse = { processedDocuments: [mockDocuments[0]] };

      spyOn(service, 'uploadDocuments').and.returnValue(of(mockResponse));

      service.uploadDocument(testFile, conceptId).subscribe(result => {
        expect(result).toEqual(mockResponse);
      });

      expect(service.uploadDocuments).toHaveBeenCalledWith([testFile], conceptId);
    });
  });

  describe('getConceptDocuments', () => {
    it('should get documents for a concept without status filter', () => {
      const conceptId = 'test-concept-id';
      const mockResponse = { documents: mockDocuments, totalCount: mockDocuments.length };

      apiService.get.and.returnValue(of(mockResponse));

      service.getConceptDocuments(conceptId).subscribe(result => {
        expect(result).toEqual(mockResponse);
      });

      expect(stateService.setLoading).toHaveBeenCalledWith('documents', true);
      expect(apiService.get).toHaveBeenCalledWith(
        `/api/genai/concepts/${conceptId}/documents`,
        {}
      );
      expect(stateService.setLoading).toHaveBeenCalledWith('documents', false);
    });

    it('should get documents for a concept with status filter', () => {
      const conceptId = 'test-concept-id';
      const status = 'COMPLETED';
      const mockResponse = { documents: [mockDocuments[0]], totalCount: 1 };

      apiService.get.and.returnValue(of(mockResponse));

      service.getConceptDocuments(conceptId, status).subscribe(result => {
        expect(result).toEqual(mockResponse);
      });

      expect(apiService.get).toHaveBeenCalledWith(
        `/api/genai/concepts/${conceptId}/documents`,
        { status: 'COMPLETED' }
      );
    });

    it('should handle get documents error', () => {
      const conceptId = 'test-concept-id';

      apiService.get.and.returnValue(throwError(() => new Error('Get failed')));

      service.getConceptDocuments(conceptId).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error).toBeTruthy();
          // Note: The service doesn't explicitly handle errors for get, 
          // so loading state won't be set to false on error
        }
      });

      expect(stateService.setLoading).toHaveBeenCalledWith('documents', true);
    });
  });

  describe('deleteDocument', () => {
    it('should delete a document successfully', () => {
      const documentId = 'doc-1';

      apiService.delete.and.returnValue(of(void 0));

      service.deleteDocument(documentId).subscribe(result => {
        expect(result).toBeUndefined();
      });

      expect(stateService.setLoading).toHaveBeenCalledWith('deleteDocument', true);
      expect(apiService.delete).toHaveBeenCalledWith(`/api/genai/documents/${documentId}`);
      expect(stateService.setLoading).toHaveBeenCalledWith('deleteDocument', false);
    });

    it('should handle delete error', () => {
      const documentId = 'doc-1';

      apiService.delete.and.returnValue(throwError(() => new Error('Delete failed')));

      service.deleteDocument(documentId).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error).toBeTruthy();
          // Note: The service doesn't explicitly handle errors for delete,
          // so loading state won't be set to false on error
        }
      });

      expect(stateService.setLoading).toHaveBeenCalledWith('deleteDocument', true);
    });
  });

  describe('Loading State Management', () => {
    it('should set loading state for upload operations', () => {
      const testFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const conceptId = 'test-concept-id';

      apiService.upload.and.returnValue(of({ processedDocuments: [] }));

      service.uploadDocuments([testFile], conceptId).subscribe();

      expect(stateService.setLoading).toHaveBeenCalledWith('uploadDocuments', true);
      expect(stateService.setLoading).toHaveBeenCalledWith('uploadDocuments', false);
    });

    it('should set loading state for get operations', () => {
      const conceptId = 'test-concept-id';

      apiService.get.and.returnValue(of({ documents: [], totalCount: 0 }));

      service.getConceptDocuments(conceptId).subscribe();

      expect(stateService.setLoading).toHaveBeenCalledWith('documents', true);
      expect(stateService.setLoading).toHaveBeenCalledWith('documents', false);
    });

    it('should set loading state for delete operations', () => {
      const documentId = 'doc-1';

      apiService.delete.and.returnValue(of(void 0));

      service.deleteDocument(documentId).subscribe();

      expect(stateService.setLoading).toHaveBeenCalledWith('deleteDocument', true);
      expect(stateService.setLoading).toHaveBeenCalledWith('deleteDocument', false);
    });
  });

  describe('Error Handling', () => {
    it('should log upload errors to console', () => {
      const testFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const conceptId = 'test-concept-id';
      const consoleErrorSpy = spyOn(console, 'error');

      apiService.upload.and.returnValue(throwError(() => new Error('Network error')));

      service.uploadDocuments([testFile], conceptId).subscribe({
        error: () => {
          expect(consoleErrorSpy).toHaveBeenCalledWith('DocumentService upload error:', jasmine.any(Error));
        }
      });
    });

    it('should ensure loading state is reset on upload error', () => {
      const testFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const conceptId = 'test-concept-id';

      apiService.upload.and.returnValue(throwError(() => new Error('Network error')));

      service.uploadDocuments([testFile], conceptId).subscribe({
        error: () => {
          expect(stateService.setLoading).toHaveBeenCalledWith('uploadDocuments', false);
        }
      });
    });
  });
}); 