import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { ConceptsListComponent } from './concepts-list.component';
import { StateService } from '../../../../core/services/state.service';
import { Concept } from '../../../../core/models/concept.model';

describe('ConceptsListComponent', () => {
  let component: ConceptsListComponent;
  let fixture: ComponentFixture<ConceptsListComponent>;
  let stateService: jasmine.SpyObj<StateService>;
  let router: Router;

  const mockConcepts: Concept[] = [
    {
      id: '1',
      title: 'Tech Conference',
      description: 'A technology conference',
      status: 'IN_PROGRESS',
      agenda: [],
      speakers: [],
      tags: ['technology', 'AI'],
      version: 1,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-10'),
      userId: 'user1',
      lastModifiedBy: 'user1'
    },
    {
      id: '2',
      title: 'Healthcare Workshop',
      description: 'A healthcare workshop',
      status: 'COMPLETED',
      agenda: [],
      speakers: [],
      tags: ['healthcare', 'medical'],
      version: 1,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-05'),
      userId: 'user1',
      lastModifiedBy: 'user1'
    },
    {
      id: '3',
      title: 'Draft Event',
      description: 'A draft event',
      status: 'DRAFT',
      agenda: [],
      speakers: [],
      tags: ['draft'],
      version: 1,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-15'),
      userId: 'user1',
      lastModifiedBy: 'user1'
    }
  ];

  beforeEach(async () => {
    const stateServiceSpy = jasmine.createSpyObj('StateService', ['getConcepts']);

    // Setup default return values
    stateServiceSpy.getConcepts.and.returnValue(of(mockConcepts));

    await TestBed.configureTestingModule({
      imports: [
        ConceptsListComponent,
        RouterTestingModule,
        NoopAnimationsModule,
        HttpClientTestingModule
      ],
      providers: [
        { provide: StateService, useValue: stateServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ConceptsListComponent);
    component = fixture.componentInstance;
    stateService = TestBed.inject(StateService) as jasmine.SpyObj<StateService>;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.searchQuery).toBe('');
    expect(component.statusFilter).toBe('ALL');
    expect(component.displayedColumns).toEqual(['title', 'status', 'updatedAt', 'tags', 'actions']);
  });

  it('should get concepts from state service', () => {
    expect(stateService.getConcepts).toHaveBeenCalled();
    expect(component.concepts$).toBeDefined();
  });

  describe('Navigation Methods', () => {
    it('should navigate to create concept', () => {
      component.createConcept();
      expect(router.navigate).toHaveBeenCalledWith(['/concepts/create']);
    });

    it('should navigate to view specific concept', () => {
      component.viewConcept('test-id');
      expect(router.navigate).toHaveBeenCalledWith(['/concepts', 'test-id']);
    });

    it('should navigate to edit concept and stop propagation', () => {
      const mockEvent = { stopPropagation: jasmine.createSpy('stopPropagation') } as any;
      
      component.editConcept(mockEvent, 'test-id');
      
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/concepts', 'test-id', 'edit']);
    });


  });

  describe('Helper Methods', () => {
    it('should return correct status icons', () => {
      expect(component.getStatusIcon('DRAFT')).toBe('edit');
      expect(component.getStatusIcon('IN_PROGRESS')).toBe('trending_up');
      expect(component.getStatusIcon('COMPLETED')).toBe('check_circle');
      expect(component.getStatusIcon('ARCHIVED')).toBe('archive');
    });

    it('should return correct status colors', () => {
      expect(component.getStatusColor('DRAFT')).toBe('warn');
      expect(component.getStatusColor('IN_PROGRESS')).toBe('accent');
      expect(component.getStatusColor('COMPLETED')).toBe('primary');
      expect(component.getStatusColor('ARCHIVED')).toBe('');
    });

    it('should return correct status display names', () => {
      expect(component.getStatusDisplayName('DRAFT')).toBe('Draft');
      expect(component.getStatusDisplayName('IN_PROGRESS')).toBe('In Progress');
      expect(component.getStatusDisplayName('COMPLETED')).toBe('Completed');
      expect(component.getStatusDisplayName('ARCHIVED')).toBe('Archived');
    });

    it('should return correct status class', () => {
      expect(component.getStatusClass('DRAFT')).toBe('status-draft');
      expect(component.getStatusClass('IN_PROGRESS')).toBe('status-in-progress');
      expect(component.getStatusClass('COMPLETED')).toBe('status-completed');
    });

    it('should track concepts by id', () => {
      const concept = mockConcepts[0];
      expect(component.trackByConcept(0, concept)).toBe(concept.id);
    });
  });

  describe('Filtering', () => {
    it('should update filtered concepts on search change', () => {
      spyOn(component, 'updateFilteredConcepts' as any);
      
      component.onSearchChange();
      
      expect(component['updateFilteredConcepts']).toHaveBeenCalled();
    });

    it('should update filtered concepts on status filter change', () => {
      spyOn(component, 'updateFilteredConcepts' as any);
      
      component.onStatusFilterChange();
      
      expect(component['updateFilteredConcepts']).toHaveBeenCalled();
    });

    it('should filter by status', () => {
      component.statusFilter = 'COMPLETED';
      component.ngOnInit();
      
      component.filteredConcepts$.subscribe(concepts => {
        expect(concepts.length).toBe(1);
        expect(concepts[0].status).toBe('COMPLETED');
      });
    });

    it('should filter by search query', () => {
      component.searchQuery = 'tech';
      component.ngOnInit();
      
      component.filteredConcepts$.subscribe(concepts => {
        expect(concepts.length).toBe(1);
        expect(concepts[0].title).toBe('Tech Conference');
      });
    });
  });
}); 