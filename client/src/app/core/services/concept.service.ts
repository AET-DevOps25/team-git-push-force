import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { 
  Concept, 
  CreateConceptRequest, 
  UpdateConceptRequest,
  ConceptStatus 
} from '../models/concept.model';

export interface ConceptFilters {
  status?: ConceptStatus;
  tags?: string[];
  search?: string;
  page?: number;
  limit?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ConceptService {
  constructor(
    private apiService: ApiService
  ) {}

  // Get all concepts with optional filtering
  getConcepts(filters?: ConceptFilters): Observable<{content: Concept[], totalElements: number, totalPages: number}> {
    const params: any = {};
    if (filters?.page !== undefined) params.page = filters.page;
    if (filters?.limit !== undefined) params.size = filters.limit;
    if (filters?.status) params.status = filters.status;
    
    return this.apiService.get<{content: Concept[], totalElements: number, totalPages: number}>('/api/concepts', params);
  }

  // Get a single concept by ID
  getConceptById(id: string): Observable<Concept> {
    return this.apiService.get<Concept>(`/api/concepts/${id}`);
  }

  // Create a new concept
  createConcept(conceptData: CreateConceptRequest): Observable<Concept> {
    return this.apiService.post<Concept>('/api/concepts', conceptData);
  }

  // Update an existing concept
  updateConcept(id: string, updates: UpdateConceptRequest): Observable<Concept> {
    return this.apiService.put<Concept>(`/api/concepts/${id}`, updates);
  }

  // Delete a concept (archives it)
  deleteConcept(id: string, permanent: boolean = false): Observable<void> {
    const endpoint = permanent ? `/api/concepts/${id}?permanent=true` : `/api/concepts/${id}`;
    return this.apiService.delete<void>(endpoint);
  }

  // Download concept as PDF
  downloadConceptPdf(id: string): Observable<Blob> {
    return this.apiService.get<Blob>(`/api/concepts/${id}/pdf`);
  }

  // Update concept status
  updateConceptStatus(id: string, status: ConceptStatus): Observable<Concept> {
    return this.updateConcept(id, { status });
  }

  // Archive/unarchive concept
  archiveConcept(id: string): Observable<Concept> {
    return this.updateConceptStatus(id, 'ARCHIVED');
  }

  unarchiveConcept(id: string): Observable<Concept> {
    return this.updateConceptStatus(id, 'DRAFT');
  }
} 