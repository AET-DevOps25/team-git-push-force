import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ApiService } from './api.service';
import { MockApiService } from '../../mocks/services/mock-api.service';
import { environment } from '../../../environments/environment';

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

  describe('HTTP Methods', () => {

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
}); 