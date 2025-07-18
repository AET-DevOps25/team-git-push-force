import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ApiService } from './api.service';
import { MockApiService } from '../../mocks/services/mock-api.service';
import { environment } from '../../../environments/environment';
import { of } from 'rxjs';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;
  let mockApiService: jasmine.SpyObj<MockApiService>;
  
  // Store original environment values
  const originalUseMockApi = environment.useMockApi;
  const originalApiUrl = environment.apiUrl;

  beforeEach(() => {
    const mockApiSpy = jasmine.createSpyObj('MockApiService', [
      'login', 'register', 'logout', 'getCurrentUser', 'getConcepts', 
      'createConcept', 'getConcept', 'updateConcept', 'deleteConcept',
      'sendChatMessage', 'getChatHistory', 'uploadDocument', 'getDocuments', 'deleteDocument'
    ]);

    // Set environment to use real API for testing
    (environment as any).useMockApi = false;
    (environment as any).apiUrl = 'https://api.test.com';

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ApiService,
        { provide: MockApiService, useValue: mockApiSpy }
      ]
    });

    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
    mockApiService = TestBed.inject(MockApiService) as jasmine.SpyObj<MockApiService>;
  });

  afterEach(() => {
    httpMock.verify();
    // Restore original environment values
    (environment as any).useMockApi = originalUseMockApi;
    (environment as any).apiUrl = originalApiUrl;
  });

  describe('Service Creation', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should have required methods', () => {
      expect(typeof service.get).toBe('function');
      expect(typeof service.post).toBe('function');
      expect(typeof service.put).toBe('function');
      expect(typeof service.delete).toBe('function');
      expect(typeof service.upload).toBe('function');
    });
  });

  describe('HTTP Methods - Real API', () => {
    describe('GET requests', () => {
      it('should make GET request without parameters', () => {
        const mockData = { id: 1, name: 'test' };

        service.get('/test').subscribe(data => {
          expect(data).toEqual(mockData);
        });

        const req = httpMock.expectOne('https://api.test.com/test');
        expect(req.request.method).toBe('GET');
        req.flush(mockData);
      });

      it('should make GET request with parameters', () => {
        const params = { page: 1, limit: 10, search: 'test' };
        const mockData = { results: [], total: 0 };

        service.get('/test', params).subscribe(data => {
          expect(data).toEqual(mockData);
        });

        const req = httpMock.expectOne('https://api.test.com/test?page=1&limit=10&search=test');
        expect(req.request.method).toBe('GET');
        req.flush(mockData);
      });

      it('should filter out null and undefined parameters', () => {
        const params = { page: 1, limit: null, search: undefined, status: 'active' };

        service.get('/test', params).subscribe();

        const req = httpMock.expectOne('https://api.test.com/test?page=1&status=active');
        expect(req.request.method).toBe('GET');
        req.flush({});
      });

      it('should handle empty parameters object', () => {
        service.get('/test', {}).subscribe();

        const req = httpMock.expectOne('https://api.test.com/test');
        expect(req.request.params.keys().length).toBe(0);
        req.flush({});
      });

      it('should convert number parameters to strings', () => {
        service.get('/test', { id: 123, count: 0 }).subscribe(data => {
          expect(data).toEqual({});
        });

        const req = httpMock.expectOne('https://api.test.com/test?id=123&count=0');
        expect(req.request.method).toBe('GET');
        req.flush({});
      });

      it('should handle boolean parameters', () => {
        service.get('/test', { active: true, archived: false }).subscribe(data => {
          expect(data).toEqual({});
        });

        const req = httpMock.expectOne('https://api.test.com/test?active=true&archived=false');
        expect(req.request.method).toBe('GET');
        req.flush({});
      });
    });

    describe('POST requests', () => {
      it('should make POST request with data', () => {
        const postData = { name: 'test', value: 123 };
        const mockResponse = { id: 1, ...postData };

        service.post('/test', postData).subscribe(data => {
          expect(data).toEqual(mockResponse);
        });

        const req = httpMock.expectOne('https://api.test.com/test');
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual(postData);
        req.flush(mockResponse);
      });
    });

    describe('PUT requests', () => {
      it('should make PUT request with data', () => {
        const putData = { id: 1, name: 'updated' };
        const mockResponse = { ...putData, updatedAt: '2024-01-01' };

        service.put('/test/1', putData).subscribe(data => {
          expect(data).toEqual(mockResponse);
        });

        const req = httpMock.expectOne('https://api.test.com/test/1');
        expect(req.request.method).toBe('PUT');
        expect(req.request.body).toEqual(putData);
        req.flush(mockResponse);
      });
    });

    describe('DELETE requests', () => {
      it('should make DELETE request', () => {
        const mockResponse = { success: true };

        service.delete('/test/1').subscribe(data => {
          expect(data).toEqual(mockResponse);
        });

        const req = httpMock.expectOne('https://api.test.com/test/1');
        expect(req.request.method).toBe('DELETE');
        req.flush(mockResponse);
      });
    });

    describe('Upload requests', () => {
      it('should make upload request with FormData', () => {
        const formData = new FormData();
        formData.append('file', new Blob(['test']), 'test.txt');
        const mockResponse = { fileId: 'abc123', url: 'https://cdn.test.com/abc123' };

        service.upload('/upload', formData).subscribe(data => {
          expect(data).toEqual(mockResponse);
        });

        const req = httpMock.expectOne('https://api.test.com/upload');
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toBe(formData);
        req.flush(mockResponse);
      });
    });

    describe('Error Handling', () => {
      it('should handle HTTP error responses', () => {
        const errorResponse = { status: 400, error: { message: 'Bad request' } };

        service.get('/test').subscribe({
          next: () => fail('Should have failed'),
          error: (error) => {
            expect(error.status).toBe(400);
            expect(error.error.message).toBe('Bad request');
          }
        });

        const req = httpMock.expectOne('https://api.test.com/test');
        req.flush(errorResponse.error, { status: 400, statusText: 'Bad Request' });
      });

      it('should handle network errors', () => {
        service.get('/test').subscribe({
          next: () => fail('Should have failed'),
          error: (error) => {
            expect(error).toBeDefined();
          }
        });

        const req = httpMock.expectOne('https://api.test.com/test');
        req.error(new ErrorEvent('Network error'));
      });
    });
  });

  describe('Mock API Request Handling', () => {
    beforeEach(() => {
      // Enable mock API for these tests
      (environment as any).useMockApi = true;
    });

    afterEach(() => {
      // Reset to real API
      (environment as any).useMockApi = false;
    });

    describe('Authentication endpoints', () => {
      it('should handle login requests', () => {
        const loginData = { email: 'test@test.com', password: 'password' };
        const mockResponse = { token: 'abc123', user: { id: 1 } };
        mockApiService.login.and.returnValue(of(mockResponse));

        service.post('/auth/login', loginData).subscribe(response => {
          expect(response).toEqual(mockResponse);
        });

        expect(mockApiService.login).toHaveBeenCalledWith(loginData.email, loginData.password);
      });

      it('should handle register requests', () => {
        const registerData = { email: 'test@test.com', password: 'password', firstName: 'Test' };
        const mockResponse = { success: true };
        mockApiService.register.and.returnValue(of(mockResponse));

        service.post('/auth/register', registerData).subscribe(response => {
          expect(response).toEqual(mockResponse);
        });

        expect(mockApiService.register).toHaveBeenCalledWith(registerData);
      });

      it('should handle logout requests', () => {
        const mockResponse = { success: true };
        mockApiService.logout.and.returnValue(of(mockResponse));

        service.post('/auth/logout', {}).subscribe(response => {
          expect(response).toEqual(mockResponse);
        });

        expect(mockApiService.logout).toHaveBeenCalled();
      });

      it('should handle current user requests', () => {
        const mockUser = { 
          id: '1', 
          email: 'test@test.com',
          firstName: 'Test',
          lastName: 'User',
          preferences: {
            preferredEventFormat: 'HYBRID' as any,
            industry: 'Technology',
            language: 'en',
            timezone: 'UTC'
          },
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        mockApiService.getCurrentUser.and.returnValue(of(mockUser));

        service.get('/users/me').subscribe(user => {
          expect(user).toEqual(mockUser);
        });

        expect(mockApiService.getCurrentUser).toHaveBeenCalled();
      });
    });

    describe('Concepts endpoints', () => {
      it('should handle get concepts requests', () => {
        const params = { page: 1, limit: 10 };
        const mockConcepts = [{ id: 1, title: 'Test Concept' }] as any;
        mockApiService.getConcepts.and.returnValue(of(mockConcepts));

        service.get('/concepts', params).subscribe(concepts => {
          expect(concepts).toEqual(mockConcepts);
        });

        expect(mockApiService.getConcepts).toHaveBeenCalledWith(params);
      });

      it('should handle create concept requests', () => {
        const conceptData = { title: 'New Concept', description: 'Test' };
        const mockResponse = { id: 1, ...conceptData } as any;
        mockApiService.createConcept.and.returnValue(of(mockResponse));

        service.post('/concepts', conceptData).subscribe(response => {
          expect(response).toEqual(mockResponse);
        });

        expect(mockApiService.createConcept).toHaveBeenCalledWith(conceptData);
      });

      it('should handle get single concept requests', () => {
        const conceptId = '123';
        const mockConcept = { id: conceptId, title: 'Test Concept' } as any;
        mockApiService.getConcept.and.returnValue(of(mockConcept));

        service.get(`/concepts/${conceptId}`).subscribe(concept => {
          expect(concept).toEqual(mockConcept);
        });

        expect(mockApiService.getConcept).toHaveBeenCalledWith(conceptId);
      });

      it('should handle update concept requests', () => {
        const conceptId = '123';
        const updateData = { title: 'Updated Concept' };
        const mockResponse = { id: conceptId, ...updateData } as any;
        mockApiService.updateConcept.and.returnValue(of(mockResponse));

        service.put(`/concepts/${conceptId}`, updateData).subscribe(response => {
          expect(response).toEqual(mockResponse);
        });

        expect(mockApiService.updateConcept).toHaveBeenCalledWith(conceptId, updateData);
      });

      it('should handle delete concept requests', () => {
        const conceptId = '123';
        const mockResponse = { success: true };
        mockApiService.deleteConcept.and.returnValue(of(mockResponse));

        service.delete(`/concepts/${conceptId}`).subscribe(response => {
          expect(response).toEqual(mockResponse);
        });

        expect(mockApiService.deleteConcept).toHaveBeenCalledWith(conceptId);
      });
    });

    describe('Chat endpoints', () => {
      it('should handle send chat message requests', () => {
        const messageData = { message: 'Hello', conceptId: '123' } as any;
        const mockResponse = { id: 1, message: 'Hello' } as any;
        mockApiService.sendChatMessage.and.returnValue(of(mockResponse));

        service.post('/chat/send', messageData).subscribe(response => {
          expect(response).toEqual(mockResponse);
        });

        expect(mockApiService.sendChatMessage).toHaveBeenCalledWith(messageData);
      });

      it('should handle get chat history requests', () => {
        const params = { conceptId: '123' };
        const mockHistory = [{ id: 1, message: 'Hello' }] as any;
        mockApiService.getChatHistory.and.returnValue(of(mockHistory));

        service.get('/chat/history', params).subscribe(history => {
          expect(history).toEqual(mockHistory);
        });

        expect(mockApiService.getChatHistory).toHaveBeenCalledWith(params.conceptId);
      });
    });

    describe('Documents endpoints', () => {
      it('should handle upload document requests', () => {
        const file = new File(['test'], 'test.txt', { type: 'text/plain' });
        const formData = new FormData();
        formData.append('file', file);
        const mockResponse = { id: '123', filename: 'test.txt' } as any;
        mockApiService.uploadDocument.and.returnValue(of(mockResponse));

        service.upload('/documents/upload', formData).subscribe(response => {
          expect(response).toEqual(mockResponse);
        });

        expect(mockApiService.uploadDocument).toHaveBeenCalledWith(file);
      });

      it('should handle get documents requests', () => {
        const params = { conceptId: '123' };
        const mockDocuments = [{ id: '1', filename: 'test.txt' }] as any;
        mockApiService.getDocuments.and.returnValue(of(mockDocuments));

        service.get('/documents', params).subscribe(documents => {
          expect(documents).toEqual(mockDocuments);
        });

        expect(mockApiService.getDocuments).toHaveBeenCalledWith(params);
      });

      it('should handle delete document requests', () => {
        const documentId = '123';
        const mockResponse = { success: true };
        mockApiService.deleteDocument.and.returnValue(of(mockResponse));

        service.delete(`/documents/${documentId}`).subscribe(response => {
          expect(response).toEqual(mockResponse);
        });

        expect(mockApiService.deleteDocument).toHaveBeenCalledWith(documentId);
      });
    });

    describe('Unknown endpoints', () => {
      it('should return 404 error for unknown endpoints', () => {
        service.get('/unknown/endpoint').subscribe({
          next: () => fail('Should have thrown error'),
          error: (error) => {
            expect(error.status).toBe(404);
            expect(error.message).toBe('Mock endpoint not found: GET /unknown/endpoint');
          }
        });
      });

      it('should return 404 error for unknown POST endpoints', () => {
        service.post('/unknown/endpoint', {}).subscribe({
          next: () => fail('Should have thrown error'),
          error: (error) => {
            expect(error.status).toBe(404);
            expect(error.message).toBe('Mock endpoint not found: POST /unknown/endpoint');
          }
        });
      });

      it('should return 404 error for unknown PUT endpoints', () => {
        service.put('/unknown/endpoint', {}).subscribe({
          next: () => fail('Should have thrown error'),
          error: (error) => {
            expect(error.status).toBe(404);
            expect(error.message).toBe('Mock endpoint not found: PUT /unknown/endpoint');
          }
        });
      });

      it('should return 404 error for unknown DELETE endpoints', () => {
        service.delete('/unknown/endpoint').subscribe({
          next: () => fail('Should have thrown error'),
          error: (error) => {
            expect(error.status).toBe(404);
            expect(error.message).toBe('Mock endpoint not found: DELETE /unknown/endpoint');
          }
        });
      });
    });
  });
}); 