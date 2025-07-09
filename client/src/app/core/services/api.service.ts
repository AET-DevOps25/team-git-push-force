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
    if (endpoint === '/auth/login' && method === 'POST') {
      return this.mockApiService.login(data.email, data.password) as Observable<T>;
    }
    if (endpoint === '/auth/register' && method === 'POST') {
      return this.mockApiService.register(data) as Observable<T>;
    }
    if (endpoint === '/auth/logout' && method === 'POST') {
      return this.mockApiService.logout() as Observable<T>;
    }
    if (endpoint === '/users/me' && method === 'GET') {
      return this.mockApiService.getCurrentUser() as Observable<T>;
    }
    if (endpoint === '/concepts' && method === 'GET') {
      return this.mockApiService.getConcepts(params) as Observable<T>;
    }
    if (endpoint === '/concepts' && method === 'POST') {
      return this.mockApiService.createConcept(data) as Observable<T>;
    }
    if (endpoint.includes('/concepts/') && method === 'GET') {
      const id = endpoint.split('/').pop();
      return this.mockApiService.getConcept(id!) as Observable<T>;
    }
    if (endpoint.includes('/concepts/') && method === 'PUT') {
      const id = endpoint.split('/').pop();
      return this.mockApiService.updateConcept(id!, data) as Observable<T>;
    }
    if (endpoint.includes('/concepts/') && method === 'DELETE') {
      const id = endpoint.split('/').pop();
      return this.mockApiService.deleteConcept(id!) as Observable<T>;
    }
    if (endpoint === '/chat/send' && method === 'POST') {
      return this.mockApiService.sendChatMessage(data) as Observable<T>;
    }
    if (endpoint === '/chat/history' && method === 'GET') {
      return this.mockApiService.getChatHistory(params?.conceptId) as Observable<T>;
    }
    if (endpoint === '/documents/upload' && method === 'POST') {
      return this.mockApiService.uploadDocument(data) as Observable<T>;
    }
    if (endpoint === '/documents' && method === 'GET') {
      return this.mockApiService.getDocuments(params) as Observable<T>;
    }
    if (endpoint.includes('/documents/') && method === 'DELETE') {
      const id = endpoint.split('/').pop();
      return this.mockApiService.deleteDocument(id!) as Observable<T>;
    }

    return throwError(() => ({ status: 404, error: { message: 'Mock endpoint not found' } }));
  }

  private handleError(error: any): Observable<never> {
    console.error('API Error:', error);
    return throwError(() => error);
  }
} 