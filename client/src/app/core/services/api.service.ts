import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, of, throwError } from 'rxjs';
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

  // New method for downloading binary files (PDFs, images, etc.)
  downloadBlob(endpoint: string, params?: any): Observable<Blob> {
    if (environment.useMockApi) {
      // Return a mock PDF blob for development
      return of(new Blob(['Mock PDF content'], { type: 'application/pdf' })) as Observable<Blob>;
    }

    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key].toString());
        }
      });
    }

    return this.http.get(`${this.baseUrl}${endpoint}`, { 
      params: httpParams,
      responseType: 'blob' // This is crucial for binary data
    })
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
    if ((endpoint === '/api/users/profile' || endpoint === '/users/profile' || endpoint === '/users/me') && method === 'GET') {
      return this.mockApiService.getCurrentUser() as Observable<T>;
    }
    
    // Concept endpoints
    if ((endpoint === '/api/concepts' || endpoint === '/concepts') && method === 'GET') {
      return this.mockApiService.getConcepts(params) as Observable<T>;
    }
    if ((endpoint === '/api/concepts' || endpoint === '/concepts') && method === 'POST') {
      return this.mockApiService.createConcept(data) as Observable<T>;
    }
    if (endpoint.match(/\/api\/concepts\/[^\/]+$/) || endpoint.match(/\/concepts\/[^\/]+$/)) {
      const conceptId = endpoint.split('/').pop()!;
      if (method === 'GET') {
        return this.mockApiService.getConcept(conceptId) as Observable<T>;
      }
      if (method === 'PUT') {
        return this.mockApiService.updateConcept(conceptId, data) as Observable<T>;
      }
      if (method === 'DELETE') {
        return this.mockApiService.deleteConcept(conceptId) as Observable<T>;
      }
    }
    
    // Chat endpoints
    if ((endpoint === '/api/chat/send' || endpoint === '/chat/send') && method === 'POST') {
      return this.mockApiService.sendChatMessage(data) as Observable<T>;
    }
    if ((endpoint === '/api/chat/history' || endpoint === '/chat/history') && method === 'GET') {
      return this.mockApiService.getChatHistory('history') as Observable<T>;
    }
    if (endpoint.match(/\/api\/chat\/history\/[^\/]+$/) || endpoint.match(/\/chat\/history\/[^\/]+$/)) {
      const conversationId = endpoint.split('/').pop()!;
      return this.mockApiService.getChatHistory(conversationId) as Observable<T>;
    }
    
    // Document endpoints  
    if ((endpoint === '/api/documents' || endpoint === '/documents') && method === 'GET') {
      return this.mockApiService.getDocuments(params) as Observable<T>;
    }
    if ((endpoint === '/api/documents/upload' || endpoint === '/documents/upload') && method === 'POST') {
      // Extract the file from FormData for the mock service
      const file = data instanceof FormData ? data.get('file') as File : data;
      return this.mockApiService.uploadDocument(file) as Observable<T>;
    }
    if ((endpoint.includes('/api/documents/') || endpoint.includes('/documents/')) && method === 'DELETE') {
      const id = endpoint.split('/').pop();
      return this.mockApiService.deleteDocument(id!) as Observable<T>;
    }

    // If no mock endpoint found, return error
    return throwError(() => ({
      status: 404,
      message: `Mock endpoint not found: ${method} ${endpoint}`
    }));
  }

  private handleError(error: any): Observable<never> {
    console.error('API Error:', error);
    return throwError(() => error);
  }
} 