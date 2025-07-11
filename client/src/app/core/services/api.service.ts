import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { MockApiService } from '../../mocks/services/mock-api.service';

export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private mockApiService: MockApiService
  ) {}

  get<T>(endpoint: string, params?: any): Observable<T> {
    if (environment.useMockApi) {
      return this.handleMockRequest<T>('GET', endpoint, null, params);
    }

    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key].toString());
        }
      });
    }

    return this.http.get<T>(`${this.baseUrl}${endpoint}`, { params: httpParams })
      .pipe(
        catchError(this.handleError)
      );
  }

  post<T>(endpoint: string, data: any): Observable<T> {
    if (environment.useMockApi) {
      return this.handleMockRequest<T>('POST', endpoint, data);
    }

    return this.http.post<T>(`${this.baseUrl}${endpoint}`, data)
      .pipe(
        catchError(this.handleError)
      );
  }

  put<T>(endpoint: string, data: any): Observable<T> {
    if (environment.useMockApi) {
      return this.handleMockRequest<T>('PUT', endpoint, data);
    }

    return this.http.put<T>(`${this.baseUrl}${endpoint}`, data)
      .pipe(
        catchError(this.handleError)
      );
  }

  delete<T>(endpoint: string): Observable<T> {
    if (environment.useMockApi) {
      return this.handleMockRequest<T>('DELETE', endpoint);
    }

    return this.http.delete<T>(`${this.baseUrl}${endpoint}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  upload<T>(endpoint: string, formData: FormData): Observable<T> {
    if (environment.useMockApi) {
      return this.handleMockRequest<T>('POST', endpoint, formData);
    }

    return this.http.post<T>(`${this.baseUrl}${endpoint}`, formData)
      .pipe(
        catchError(this.handleError)
      );
  }



  private handleMockRequest<T>(method: string, endpoint: string, data?: any, params?: any): Observable<T> {
    // Auth endpoints
    if (endpoint === '/auth/login' && method === 'POST') {
      return this.mockApiService.login(data.email, data.password) as Observable<T>;
    }
    if (endpoint === '/auth/register' && method === 'POST') {
      return this.mockApiService.register(data) as Observable<T>;
    }
    if (endpoint === '/auth/logout' && method === 'POST') {
      return this.mockApiService.logout() as Observable<T>;
    }
    
    // User endpoints
    if (endpoint === '/api/users/profile' && method === 'GET') {
      return this.mockApiService.getCurrentUser() as Observable<T>;
    }
    
    // Concept endpoints
    if (endpoint === '/api/concepts' && method === 'GET') {
      return this.mockApiService.getConcepts(params) as Observable<T>;
    }
    if (endpoint === '/api/concepts' && method === 'POST') {
      return this.mockApiService.createConcept(data) as Observable<T>;
    }
    if (endpoint.includes('/api/concepts/') && method === 'GET' && !endpoint.includes('/pdf')) {
      const id = endpoint.split('/').pop();
      return this.mockApiService.getConcept(id!) as Observable<T>;
    }
    if (endpoint.includes('/api/concepts/') && method === 'PUT') {
      const id = endpoint.split('/').pop();
      return this.mockApiService.updateConcept(id!, data) as Observable<T>;
    }
    if (endpoint.includes('/api/concepts/') && method === 'DELETE') {
      const id = endpoint.split('/').pop()?.split('?')[0]; // Remove query params
      return this.mockApiService.deleteConcept(id!) as Observable<T>;
    }
    
    // GenAI Chat endpoints (new API paths)
    if (endpoint === '/api/genai/chat' && method === 'POST') {
      return this.mockApiService.sendChatMessage(data) as Observable<T>;
    }
    if (endpoint === '/api/genai/chat/initialize' && method === 'POST') {
      // Mock chat initialization
      return { 
        message: `Welcome! I'm here to help you develop your event concept "${data.conceptTitle || 'your event'}".`,
        suggestions: ['Tell me more about your target audience', 'What format are you considering?', 'Help me with the agenda'],
        conversationId: data.conceptId
      } as any;
    }
    
    // GenAI Document endpoints (new API paths)
    if (endpoint.includes('/api/genai/documents') && method === 'POST' && endpoint.includes('conceptId=')) {
      // Extract files from FormData for mock service - use first file for mock
      const files = data.getAll('files') as File[];
      if (files.length > 0) {
        return this.mockApiService.uploadDocument(files[0]) as Observable<T>;
      }
      return throwError(() => ({ status: 400, error: { message: 'No files provided' } }));
    }
    if (endpoint.includes('/api/genai/concepts/') && endpoint.includes('/documents') && method === 'GET') {
      const conceptId = endpoint.split('/')[4]; // Extract conceptId from path
      return this.mockApiService.getDocuments({ conceptId, status: params?.status }) as Observable<T>;
    }
    if (endpoint.includes('/api/genai/documents/') && method === 'DELETE') {
      const id = endpoint.split('/').pop();
      return this.mockApiService.deleteDocument(id!) as Observable<T>;
    }

    return throwError(() => ({ status: 404, error: { message: `Mock endpoint not found: ${method} ${endpoint}` } }));
  }

  private handleError(error: any): Observable<never> {
    console.error('API Error:', error);
    return throwError(() => error);
  }
} 