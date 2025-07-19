import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ConceptService, ConceptFilters } from './concept.service';
import { ApiService } from './api.service';
import { 
  Concept, 
  CreateConceptRequest, 
  UpdateConceptRequest,
  ConceptStatus 
} from '../models/concept.model';

describe('ConceptService', () => {
  let service: ConceptService;
  let apiService: jasmine.SpyObj<ApiService>;

  const mockConcepts: Concept[] = [
    {
      id: 'concept-1',
      title: 'Tech Conference 2024',
      description: 'Annual technology conference for developers',
      status: 'IN_PROGRESS',
      agenda: [
        {
          id: 'agenda-1',
          time: '09:00',
          title: 'Opening Keynote',
          description: 'Welcome and introduction',
          duration: 60,
          speaker: 'John Doe',
          type: 'KEYNOTE'
        }
      ],
      speakers: [
        {
          id: 'speaker-1',
          name: 'John Doe',
          bio: 'Senior Developer',
          expertise: 'JavaScript and React',
          confirmed: true
        }
      ],
      tags: ['technology', 'development', 'conference'],
      version: 1,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
      userId: 'user-1',
      lastModifiedBy: 'user-1'
    },
    {
      id: 'concept-2',
      title: 'Marketing Summit',
      description: 'Strategic marketing summit for professionals',
      status: 'DRAFT',
      agenda: [],
      speakers: [],
      tags: ['marketing', 'strategy'],
      version: 1,
      createdAt: new Date('2024-01-03'),
      updatedAt: new Date('2024-01-03'),
      userId: 'user-2',
      lastModifiedBy: 'user-2'
    }
  ];

  const mockConceptsResponse = {
    content: mockConcepts,
    totalElements: 2,
    totalPages: 1
  };

  beforeEach(() => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        ConceptService,
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });

    service = TestBed.inject(ConceptService);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getConcepts', () => {
    it('should get concepts without filters', () => {
      apiService.get.and.returnValue(of(mockConceptsResponse));

      service.getConcepts().subscribe(response => {
        expect(response).toEqual(mockConceptsResponse);
      });

      expect(apiService.get).toHaveBeenCalledWith('/api/concepts', {});
    });

    it('should get concepts with pagination filters', () => {
      const filters: ConceptFilters = {
        page: 1,
        limit: 10
      };

      apiService.get.and.returnValue(of(mockConceptsResponse));

      service.getConcepts(filters).subscribe();

      expect(apiService.get).toHaveBeenCalledWith('/api/concepts', {
        page: 1,
        size: 10
      });
    });

    it('should get concepts with status filter', () => {
      const filters: ConceptFilters = {
        status: 'IN_PROGRESS'
      };

      apiService.get.and.returnValue(of(mockConceptsResponse));

      service.getConcepts(filters).subscribe();

      expect(apiService.get).toHaveBeenCalledWith('/api/concepts', {
        status: 'IN_PROGRESS'
      });
    });

    it('should get concepts with all filters', () => {
      const filters: ConceptFilters = {
        status: 'DRAFT',
        tags: ['technology', 'conference'],
        search: 'tech',
        page: 2,
        limit: 5
      };

      apiService.get.and.returnValue(of(mockConceptsResponse));

      service.getConcepts(filters).subscribe();

      expect(apiService.get).toHaveBeenCalledWith('/api/concepts', {
        status: 'DRAFT',
        page: 2,
        size: 5
      });
    });

    it('should handle get concepts error', () => {
      const errorMessage = 'Failed to fetch concepts';
      apiService.get.and.returnValue(throwError(() => new Error(errorMessage)));

      service.getConcepts().subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.message).toBe(errorMessage);
        }
      });
    });

    it('should not include undefined filter values in params', () => {
      const filters: ConceptFilters = {
        page: 0,
        limit: undefined,
        status: undefined
      };

      apiService.get.and.returnValue(of(mockConceptsResponse));

      service.getConcepts(filters).subscribe();

      expect(apiService.get).toHaveBeenCalledWith('/api/concepts', {
        page: 0
      });
    });
  });

  describe('getConceptById', () => {
    it('should get concept by ID successfully', () => {
      const conceptId = 'concept-1';
      const expectedConcept = mockConcepts[0];

      apiService.get.and.returnValue(of(expectedConcept));

      service.getConceptById(conceptId).subscribe(concept => {
        expect(concept).toEqual(expectedConcept);
      });

      expect(apiService.get).toHaveBeenCalledWith(`/api/concepts/${conceptId}`);
    });

    it('should handle get concept by ID error', () => {
      const conceptId = 'non-existent-id';
      const errorMessage = 'Concept not found';

      apiService.get.and.returnValue(throwError(() => new Error(errorMessage)));

      service.getConceptById(conceptId).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.message).toBe(errorMessage);
        }
      });
    });
  });

  describe('createConcept', () => {
    it('should create concept successfully', () => {
      const createRequest: CreateConceptRequest = {
        title: 'New Conference',
        description: 'A new exciting conference',
        tags: ['new', 'conference']
      };
      const createdConcept = { ...mockConcepts[0], ...createRequest };

      apiService.post.and.returnValue(of(createdConcept));

      service.createConcept(createRequest).subscribe(concept => {
        expect(concept).toEqual(createdConcept);
      });

      expect(apiService.post).toHaveBeenCalledWith('/api/concepts', createRequest);
    });

    it('should handle create concept error', () => {
      const createRequest: CreateConceptRequest = {
        title: 'Invalid Conference',
        description: '',
        tags: []
      };
      const errorMessage = 'Validation failed';

      apiService.post.and.returnValue(throwError(() => new Error(errorMessage)));

      service.createConcept(createRequest).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.message).toBe(errorMessage);
        }
      });
    });
  });

  describe('updateConcept', () => {
    it('should update concept successfully', () => {
      const conceptId = 'concept-1';
      const updateRequest: UpdateConceptRequest = {
        title: 'Updated Conference Title',
        status: 'COMPLETED'
      };
      const updatedConcept = { ...mockConcepts[0], ...updateRequest };

      apiService.put.and.returnValue(of(updatedConcept));

      service.updateConcept(conceptId, updateRequest).subscribe(concept => {
        expect(concept).toEqual(updatedConcept);
      });

      expect(apiService.put).toHaveBeenCalledWith(`/api/concepts/${conceptId}`, updateRequest);
    });

    it('should handle update concept error', () => {
      const conceptId = 'concept-1';
      const updateRequest: UpdateConceptRequest = {
        title: ''
      };
      const errorMessage = 'Invalid title';

      apiService.put.and.returnValue(throwError(() => new Error(errorMessage)));

      service.updateConcept(conceptId, updateRequest).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.message).toBe(errorMessage);
        }
      });
    });
  });

  describe('deleteConcept', () => {
    it('should delete concept (archive) by default', () => {
      const conceptId = 'concept-1';

      apiService.delete.and.returnValue(of(void 0));

      service.deleteConcept(conceptId).subscribe(result => {
        expect(result).toBeUndefined();
      });

      expect(apiService.delete).toHaveBeenCalledWith(`/api/concepts/${conceptId}`);
    });

    it('should permanently delete concept when permanent is true', () => {
      const conceptId = 'concept-1';

      apiService.delete.and.returnValue(of(void 0));

      service.deleteConcept(conceptId, true).subscribe(result => {
        expect(result).toBeUndefined();
      });

      expect(apiService.delete).toHaveBeenCalledWith(`/api/concepts/${conceptId}?permanent=true`);
    });

    it('should handle delete concept error', () => {
      const conceptId = 'concept-1';
      const errorMessage = 'Failed to delete concept';

      apiService.delete.and.returnValue(throwError(() => new Error(errorMessage)));

      service.deleteConcept(conceptId).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.message).toBe(errorMessage);
        }
      });
    });
  });

  describe('downloadConceptPdf', () => {
    it('should download concept PDF successfully', () => {
      const conceptId = 'concept-1';
      const mockBlob = new Blob(['PDF content'], { type: 'application/pdf' });

      apiService.get.and.returnValue(of(mockBlob));

      service.downloadConceptPdf(conceptId).subscribe(blob => {
        expect(blob).toEqual(mockBlob);
      });

      expect(apiService.get).toHaveBeenCalledWith(`/api/concepts/${conceptId}/pdf`);
    });

    it('should handle download PDF error', () => {
      const conceptId = 'concept-1';
      const errorMessage = 'PDF generation failed';

      apiService.get.and.returnValue(throwError(() => new Error(errorMessage)));

      service.downloadConceptPdf(conceptId).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.message).toBe(errorMessage);
        }
      });
    });
  });

  describe('updateConceptStatus', () => {
    it('should update concept status', () => {
      const conceptId = 'concept-1';
      const newStatus: ConceptStatus = 'COMPLETED';
      const updatedConcept = { ...mockConcepts[0], status: newStatus };

      spyOn(service, 'updateConcept').and.returnValue(of(updatedConcept));

      service.updateConceptStatus(conceptId, newStatus).subscribe(concept => {
        expect(concept.status).toBe(newStatus);
      });

      expect(service.updateConcept).toHaveBeenCalledWith(conceptId, { status: newStatus });
    });
  });

  describe('archiveConcept', () => {
    it('should archive concept', () => {
      const conceptId = 'concept-1';
      const archivedConcept = { ...mockConcepts[0], status: 'ARCHIVED' as ConceptStatus };

      spyOn(service, 'updateConceptStatus').and.returnValue(of(archivedConcept));

      service.archiveConcept(conceptId).subscribe(concept => {
        expect(concept.status).toBe('ARCHIVED');
      });

      expect(service.updateConceptStatus).toHaveBeenCalledWith(conceptId, 'ARCHIVED');
    });
  });

  describe('unarchiveConcept', () => {
    it('should unarchive concept', () => {
      const conceptId = 'concept-1';
      const unarchivedConcept = { ...mockConcepts[0], status: 'DRAFT' as ConceptStatus };

      spyOn(service, 'updateConceptStatus').and.returnValue(of(unarchivedConcept));

      service.unarchiveConcept(conceptId).subscribe(concept => {
        expect(concept.status).toBe('DRAFT');
      });

      expect(service.updateConceptStatus).toHaveBeenCalledWith(conceptId, 'DRAFT');
    });
  });

  describe('Edge Cases and Integration', () => {
    it('should handle empty concept list', () => {
      const emptyResponse = {
        content: [],
        totalElements: 0,
        totalPages: 0
      };

      apiService.get.and.returnValue(of(emptyResponse));

      service.getConcepts().subscribe(response => {
        expect(response.content).toEqual([]);
        expect(response.totalElements).toBe(0);
      });
    });

    it('should handle network timeout error', () => {
      const timeoutError = { name: 'TimeoutError', message: 'Request timed out' };
      apiService.get.and.returnValue(throwError(() => timeoutError));

      service.getConcepts().subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.name).toBe('TimeoutError');
        }
      });
    });

    it('should handle HTTP error responses', () => {
      const httpError = { status: 404, statusText: 'Not Found' };
      apiService.get.and.returnValue(throwError(() => httpError));

      service.getConceptById('non-existent').subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });
    });

    it('should handle invalid concept data gracefully', () => {
      const invalidConcept = { ...mockConcepts[0], id: 'invalid-id', title: '' };
      apiService.get.and.returnValue(of(invalidConcept));

      service.getConceptById('concept-1').subscribe(concept => {
        expect(concept).toEqual(invalidConcept);
      });
    });

    it('should handle status changes for all valid statuses', () => {
      const conceptId = 'concept-1';
      const statuses: ConceptStatus[] = ['DRAFT', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED'];
      
      const updateSpy = spyOn(service, 'updateConcept');

      statuses.forEach(status => {
        const updatedConcept = { ...mockConcepts[0], status };
        updateSpy.and.returnValue(of(updatedConcept));

        service.updateConceptStatus(conceptId, status).subscribe(concept => {
          expect(concept.status).toBe(status);
        });

        expect(service.updateConcept).toHaveBeenCalledWith(conceptId, { status });
      });
    });
  });

  describe('Method Chaining and Dependencies', () => {
    it('should chain archive and unarchive operations', () => {
      const conceptId = 'concept-1';
      const archivedConcept = { ...mockConcepts[0], status: 'ARCHIVED' as ConceptStatus };
      const unarchivedConcept = { ...mockConcepts[0], status: 'DRAFT' as ConceptStatus };

      spyOn(service, 'updateConceptStatus')
        .and.returnValues(of(archivedConcept), of(unarchivedConcept));

      // Archive first, then unarchive
      service.archiveConcept(conceptId).subscribe(archived => {
        expect(archived.status).toBe('ARCHIVED');
        
        service.unarchiveConcept(conceptId).subscribe(unarchived => {
          expect(unarchived.status).toBe('DRAFT');
        });
      });

      expect(service.updateConceptStatus).toHaveBeenCalledTimes(2);
    });

    it('should handle create-then-update workflow', () => {
      const createRequest: CreateConceptRequest = {
        title: 'New Conference',
        description: 'Description',
        tags: ['test']
      };
      const createdConcept = { ...mockConcepts[0], ...createRequest };
      const updateRequest: UpdateConceptRequest = { status: 'IN_PROGRESS' };
      const updatedConcept = { ...createdConcept, status: 'IN_PROGRESS' as ConceptStatus };

      apiService.post.and.returnValue(of(createdConcept));
      apiService.put.and.returnValue(of(updatedConcept));

      service.createConcept(createRequest).subscribe(created => {
        expect(created.title).toBe(createRequest.title);
        
        service.updateConcept(created.id, updateRequest).subscribe(updated => {
          expect(updated.status).toBe('IN_PROGRESS');
        });
      });
    });
  });
}); 