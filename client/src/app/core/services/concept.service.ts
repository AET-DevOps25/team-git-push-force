import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { StateService } from './state.service';
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
    private apiService: ApiService,
    private stateService: StateService
  ) {}

  // Get all concepts with optional filtering
  getConcepts(filters?: ConceptFilters): Observable<{content: Concept[], totalElements: number, totalPages: number}> {
    this.stateService.setLoading('concepts', true);
    
    const params: any = {};
    if (filters?.page !== undefined) params.page = filters.page;
    if (filters?.limit !== undefined) params.size = filters.limit;
    if (filters?.status) params.status = filters.status;
    
    return this.apiService.get<{content: Concept[], totalElements: number, totalPages: number}>('/api/concepts', params)
      .pipe(
        tap(response => {
          this.stateService.setConcepts(response.content);
          this.stateService.setLoading('concepts', false);
        })
      );
  }

  // Get a single concept by ID
  getConceptById(id: string): Observable<Concept> {
    this.stateService.setLoading('concept', true);
    
    return this.apiService.get<Concept>(`/api/concepts/${id}`)
      .pipe(
        tap(concept => {
          this.stateService.setCurrentConcept(concept);
          this.stateService.setLoading('concept', false);
        })
      );
  }

  // Create a new concept
  createConcept(conceptData: CreateConceptRequest): Observable<Concept> {
    this.stateService.setLoading('createConcept', true);
    
    return this.apiService.post<Concept>('/api/concepts', conceptData)
      .pipe(
        tap(concept => {
          this.stateService.addConcept(concept);
          this.stateService.setCurrentConcept(concept);
          this.stateService.setLoading('createConcept', false);
        })
      );
  }

  // Update an existing concept
  updateConcept(id: string, updates: UpdateConceptRequest): Observable<Concept> {
    this.stateService.setLoading('updateConcept', true);
    
    return this.apiService.put<Concept>(`/api/concepts/${id}`, updates)
      .pipe(
        tap(concept => {
          this.stateService.updateConcept(concept);
          this.stateService.setCurrentConcept(concept);
          this.stateService.setLoading('updateConcept', false);
        })
      );
  }

  // Delete a concept (archives it)
  deleteConcept(id: string, permanent: boolean = false): Observable<void> {
    this.stateService.setLoading('deleteConcept', true);
    
    const endpoint = permanent ? `/api/concepts/${id}?permanent=true` : `/api/concepts/${id}`;
    return this.apiService.delete<void>(endpoint)
      .pipe(
        tap(() => {
          this.stateService.removeConcept(id);
          this.stateService.setLoading('deleteConcept', false);
        })
      );
  }

  // Download concept as PDF
  downloadConceptPdf(id: string): Observable<Blob> {
    return this.apiService.get<Blob>(`/api/concepts/${id}/pdf`);
  }

  // Apply AI concept suggestion
  applyConceptSuggestion(id: string, suggestion: any, applyMode: 'REPLACE' | 'MERGE' = 'MERGE'): Observable<Concept> {
    this.stateService.setLoading('applySuggestion', true);
    
    return this.apiService.post<Concept>(`/api/concepts/${id}/apply-suggestion`, {
      suggestion,
      applyMode
    }).pipe(
      tap(concept => {
        this.stateService.updateConcept(concept);
        this.stateService.setCurrentConcept(concept);
        this.stateService.setLoading('applySuggestion', false);
      })
    );
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