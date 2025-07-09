import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { StateService } from './state.service';
import { ProcessedDocument, DocumentUploadResult } from '../models/document.model';

export interface DocumentFilters {
  conceptId?: string;
  type?: 'INDUSTRY_REPORT' | 'BRAND_DECK' | 'PAST_EVENT_DEBRIEF' | 'GUIDELINES' | 'OTHER';
  status?: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  page?: number;
  limit?: number;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  constructor(
    private apiService: ApiService,
    private stateService: StateService
  ) {}

  // Upload documents for processing (requires conceptId)
  uploadDocuments(files: File[], conceptId: string): Observable<{processedDocuments: ProcessedDocument[]}> {
    this.stateService.setLoading('uploadDocuments', true);
    
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append('files', file);
    });

    const endpoint = `/api/genai/documents?conceptId=${conceptId}`;
    return this.apiService.upload<{processedDocuments: ProcessedDocument[]}>(endpoint, formData)
      .pipe(
        tap(result => {
          this.stateService.setLoading('uploadDocuments', false);
        })
      );
  }

  // Upload a single document (convenience method)
  uploadDocument(file: File, conceptId: string): Observable<{processedDocuments: ProcessedDocument[]}> {
    return this.uploadDocuments([file], conceptId);
  }

  // Get documents for a specific concept
  getConceptDocuments(
    conceptId: string, 
    status?: 'PROCESSING' | 'COMPLETED' | 'FAILED'
  ): Observable<{documents: ProcessedDocument[], totalCount: number}> {
    this.stateService.setLoading('documents', true);
    
    const params: any = {};
    if (status) params.status = status;
    
    return this.apiService.get<{documents: ProcessedDocument[], totalCount: number}>(`/api/genai/concepts/${conceptId}/documents`, params)
      .pipe(
        tap(result => {
          this.stateService.setLoading('documents', false);
        })
      );
  }

  // Delete a document
  deleteDocument(documentId: string): Observable<void> {
    this.stateService.setLoading('deleteDocument', true);
    
    return this.apiService.delete<void>(`/api/genai/documents/${documentId}`)
      .pipe(
        tap(() => {
          this.stateService.setLoading('deleteDocument', false);
        })
      );
  }
} 