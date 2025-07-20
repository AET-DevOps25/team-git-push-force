import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { DocumentsDialogComponent, DocumentsDialogData } from './documents-dialog.component';
import { DocumentService } from '../../../../core/services/document.service';
import { ProcessedDocument } from '../../../../core/models/document.model';

describe('DocumentsDialogComponent', () => {
  let component: DocumentsDialogComponent;
  let fixture: ComponentFixture<DocumentsDialogComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<DocumentsDialogComponent>>;
  let mockDocumentService: jasmine.SpyObj<DocumentService>;

  const mockDialogData: DocumentsDialogData = {
    conceptId: 'test-concept-id',
    conceptTitle: 'Test Concept Title'
  };

  const mockDocument: ProcessedDocument = {
    id: 'doc-1',
    filename: 'test-document.pdf',
    uploadedAt: '2024-01-15T10:30:00Z',
    status: 'COMPLETED',
    type: 'INDUSTRY_REPORT',
    s3Location: 's3://bucket/path/doc-1.pdf',
    processedAt: '2024-01-15T10:35:00Z'
  };

  const mockDocuments: ProcessedDocument[] = [
    mockDocument,
    {
      ...mockDocument,
      id: 'doc-2',
      filename: 'test-document-2.docx',
      status: 'PROCESSING',
      type: 'BRAND_DECK'
    }
  ];

  beforeEach(async () => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockDocumentService = jasmine.createSpyObj('DocumentService', [
      'getConceptDocuments',
      'uploadDocuments',
      'deleteDocument'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        DocumentsDialogComponent,
        NoopAnimationsModule
      ],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: DocumentService, useValue: mockDocumentService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentsDialogComponent);
    component = fixture.componentInstance;
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with correct dialog data', () => {
      expect(component.data).toEqual(mockDialogData);
    });

    it('should start with loading state', () => {
      expect(component.isLoading).toBe(true);
      expect(component.isUploading).toBe(false);
      expect(component.documents).toEqual([]);
    });
  });

  describe('Document Loading', () => {
         it('should load documents on init', () => {
       mockDocumentService.getConceptDocuments.and.returnValue(
         of({ documents: mockDocuments, totalCount: mockDocuments.length })
       );

       component.ngOnInit();

       expect(mockDocumentService.getConceptDocuments).toHaveBeenCalledWith('test-concept-id');
       expect(component.documents).toEqual(mockDocuments);
       expect(component.isLoading).toBe(false);
     });

         it('should handle error when loading documents', () => {
       spyOn(console, 'error');
       mockDocumentService.getConceptDocuments.and.returnValue(
         throwError(() => new Error('Load error'))
       );

       component.ngOnInit();

       expect(component.isLoading).toBe(false);
       expect(component.documents).toEqual([]);
       expect(console.error).toHaveBeenCalledWith('Error loading documents:', jasmine.any(Error));
     });

     it('should reload documents when loadDocuments is called', () => {
       mockDocumentService.getConceptDocuments.and.returnValue(
         of({ documents: mockDocuments, totalCount: mockDocuments.length })
       );

       component.loadDocuments();

       expect(component.isLoading).toBe(false);
       expect(component.documents).toEqual(mockDocuments);
     });
  });

  describe('File Upload', () => {
    beforeEach(() => {
      // Initialize component with existing documents
      component.documents = [...mockDocuments];
    });

    it('should handle file selection and upload', () => {
      const mockFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const mockEvent = {
        target: { files: [mockFile] }
      } as any;

      const newDocument: ProcessedDocument = {
        ...mockDocument,
        id: 'doc-3',
        filename: 'test.pdf'
      };

      mockDocumentService.uploadDocuments.and.returnValue(
        of({ processedDocuments: [newDocument] })
      );

      component.onFileSelected(mockEvent);

      expect(mockDocumentService.uploadDocuments).toHaveBeenCalledWith([mockFile], 'test-concept-id');
      expect(component.documents).toContain(newDocument);
      expect(component.isUploading).toBe(false);
    });

    it('should handle upload with multiple files', () => {
      const mockFiles = [
        new File(['content1'], 'test1.pdf', { type: 'application/pdf' }),
        new File(['content2'], 'test2.pdf', { type: 'application/pdf' })
      ];

      spyOn(component, 'uploadFiles');
      const mockEvent = {
        target: { files: mockFiles }
      } as any;

      component.onFileSelected(mockEvent);

      expect(component.uploadFiles).toHaveBeenCalledWith(mockFiles);
    });

    it('should handle empty file selection', () => {
      const mockEvent = {
        target: { files: null }
      } as any;

      spyOn(component, 'uploadFiles');
      component.onFileSelected(mockEvent);

      expect(component.uploadFiles).not.toHaveBeenCalled();
    });

    it('should filter out empty files before upload', () => {
      spyOn(console, 'error');
      const emptyFile = new File([''], 'empty.pdf', { type: 'application/pdf' });
      Object.defineProperty(emptyFile, 'size', { value: 0 });

      component.uploadFiles([emptyFile]);

      expect(console.error).toHaveBeenCalledWith('No valid files to upload');
      expect(mockDocumentService.uploadDocuments).not.toHaveBeenCalled();
    });

    it('should handle upload error', () => {
      spyOn(console, 'error');
      const mockFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      
      mockDocumentService.uploadDocuments.and.returnValue(
        throwError(() => new Error('Upload error'))
      );

      component.uploadFiles([mockFile]);

      expect(component.isUploading).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Error uploading documents:', jasmine.any(Error));
    });

    it('should set uploading state during upload', () => {
      const mockFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      
      mockDocumentService.uploadDocuments.and.returnValue(
        of({ processedDocuments: [mockDocument] })
      );

      component.uploadFiles([mockFile]);

      expect(component.isUploading).toBe(false); // Should be false after completion
    });
  });

  describe('Document Deletion', () => {
    beforeEach(() => {
      component.documents = [...mockDocuments];
    });

         it('should delete document successfully', () => {
       mockDocumentService.deleteDocument.and.returnValue(of(undefined));

       component.deleteDocument(mockDocument);

       expect(mockDocumentService.deleteDocument).toHaveBeenCalledWith('doc-1');
       expect(component.documents).not.toContain(mockDocument);
       expect(component.documents.length).toBe(1);
     });

    it('should handle delete error', () => {
      spyOn(console, 'error');
      mockDocumentService.deleteDocument.and.returnValue(
        throwError(() => new Error('Delete error'))
      );

      const originalLength = component.documents.length;
      component.deleteDocument(mockDocument);

      expect(component.documents.length).toBe(originalLength);
      expect(console.error).toHaveBeenCalledWith('Error deleting document:', jasmine.any(Error));
    });
  });

  describe('Dialog Actions', () => {
    it('should close dialog when onClose is called', () => {
      component.onClose();
      expect(mockDialogRef.close).toHaveBeenCalled();
    });
  });

  describe('Helper Methods', () => {
    describe('getStatusIcon', () => {
      it('should return correct icons for different statuses', () => {
        expect(component.getStatusIcon('COMPLETED')).toBe('check_circle');
        expect(component.getStatusIcon('PROCESSING')).toBe('pending');
        expect(component.getStatusIcon('FAILED')).toBe('error');
        expect(component.getStatusIcon('QUEUED')).toBe('schedule');
        expect(component.getStatusIcon('UNKNOWN')).toBe('description');
      });
    });

    describe('getStatusColor', () => {
      it('should return correct colors for different statuses', () => {
        expect(component.getStatusColor('COMPLETED')).toBe('primary');
        expect(component.getStatusColor('PROCESSING')).toBe('accent');
        expect(component.getStatusColor('FAILED')).toBe('warn');
        expect(component.getStatusColor('UNKNOWN')).toBe('');
      });
    });

    describe('getTypeIcon', () => {
      it('should return correct icons for different document types', () => {
        expect(component.getTypeIcon('INDUSTRY_REPORT')).toBe('assessment');
        expect(component.getTypeIcon('BRAND_DECK')).toBe('palette');
        expect(component.getTypeIcon('PAST_EVENT_DEBRIEF')).toBe('event_note');
        expect(component.getTypeIcon('GUIDELINES')).toBe('rule');
        expect(component.getTypeIcon('UNKNOWN')).toBe('description');
      });
    });

    describe('formatFileSize', () => {
      it('should format file sizes correctly', () => {
        expect(component.formatFileSize(0)).toBe('0 Bytes');
        expect(component.formatFileSize(1024)).toBe('1 KB');
        expect(component.formatFileSize(1048576)).toBe('1 MB');
        expect(component.formatFileSize(1073741824)).toBe('1 GB');
        expect(component.formatFileSize(1536)).toBe('1.5 KB');
      });
    });

    describe('formatDate', () => {
      it('should format dates correctly', () => {
        const testDate = '2024-01-15T10:30:00Z';
        const formatted = component.formatDate(testDate);
        
        expect(formatted).toContain('Jan');
        expect(formatted).toContain('15');
        expect(formatted).toMatch(/\d{1,2}:\d{2}/); // Time format
      });
    });

    describe('trackByDocumentId', () => {
      it('should return document id for tracking', () => {
        const result = component.trackByDocumentId(0, mockDocument);
        expect(result).toBe('doc-1');
      });
    });
  });

  describe('Component Lifecycle', () => {
    it('should load documents on ngOnInit', () => {
      spyOn(component, 'loadDocuments');
      
      component.ngOnInit();
      
      expect(component.loadDocuments).toHaveBeenCalled();
    });

    it('should complete destroy subject on ngOnDestroy', () => {
      spyOn(component['destroy$'], 'next');
      spyOn(component['destroy$'], 'complete');
      
      component.ngOnDestroy();
      
      expect(component['destroy$'].next).toHaveBeenCalled();
      expect(component['destroy$'].complete).toHaveBeenCalled();
    });
  });

     describe('Template Integration', () => {
     beforeEach(() => {
       mockDocumentService.getConceptDocuments.and.returnValue(
         of({ documents: mockDocuments, totalCount: mockDocuments.length })
       );
       fixture.detectChanges();
     });

    it('should display concept title in header', () => {
      const headerText = fixture.nativeElement.querySelector('.header-text p');
      expect(headerText?.textContent?.trim()).toBe('Test Concept Title');
    });

    it('should display documents count', () => {
      const sectionHeader = fixture.nativeElement.querySelector('.section-header h3');
      expect(sectionHeader?.textContent?.trim()).toContain('Documents (2)');
    });

    it('should show loading spinner when loading', () => {
      component.isLoading = true;
      fixture.detectChanges();
      
      const spinner = fixture.nativeElement.querySelector('mat-spinner');
      expect(spinner).toBeTruthy();
    });

    it('should show empty state when no documents', () => {
      component.documents = [];
      component.isLoading = false;
      fixture.detectChanges();
      
      const emptyState = fixture.nativeElement.querySelector('.empty-state');
      expect(emptyState).toBeTruthy();
    });

    it('should disable upload button when uploading', () => {
      component.isUploading = true;
      fixture.detectChanges();
      
      const uploadButton = fixture.nativeElement.querySelector('.upload-button');
      expect(uploadButton?.disabled).toBe(true);
    });
  });
}); 