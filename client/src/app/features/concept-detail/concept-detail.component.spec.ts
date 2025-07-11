import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { ConceptDetailComponent } from './concept-detail.component';
import { StateService } from '../../core/services/state.service';
import { Concept } from '../../core/models/concept.model';

describe('ConceptDetailComponent', () => {
  let component: ConceptDetailComponent;
  let fixture: ComponentFixture<ConceptDetailComponent>;
  let stateService: jasmine.SpyObj<StateService>;
  let router: Router;
  let activatedRoute: ActivatedRoute;

  const mockConcept: Concept = {
    id: 'test-concept-id',
    title: 'Test Conference',
    description: 'A test conference for developers',
    status: 'IN_PROGRESS',
    agenda: [],
    speakers: [],
    tags: ['technology', 'test'],
    version: 1,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    userId: 'user1',
    lastModifiedBy: 'user1'
  };

  const mockConcepts: Concept[] = [
    mockConcept,
    {
      id: 'other-concept',
      title: 'Other Conference',
      description: 'Another conference',
      status: 'DRAFT',
      agenda: [],
      speakers: [],
      tags: ['other'],
      version: 1,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      userId: 'user1',
      lastModifiedBy: 'user1'
    }
  ];

  beforeEach(async () => {
    const stateServiceSpy = jasmine.createSpyObj('StateService', ['getCurrentConcept', 'getConcepts', 'setCurrentConcept']);

    await TestBed.configureTestingModule({
      imports: [
        ConceptDetailComponent,
        RouterTestingModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: StateService, useValue: stateServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: { id: 'test-concept-id' } }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ConceptDetailComponent);
    component = fixture.componentInstance;
    stateService = TestBed.inject(StateService) as jasmine.SpyObj<StateService>;
    router = TestBed.inject(Router);
    activatedRoute = TestBed.inject(ActivatedRoute);
    spyOn(router, 'navigate');
  });

  it('should create', () => {
    stateService.getCurrentConcept.and.returnValue(of(null));
    stateService.getConcepts.and.returnValue(of(mockConcepts));
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should initialize with concept ID from route', () => {
    stateService.getCurrentConcept.and.returnValue(of(null));
    stateService.getConcepts.and.returnValue(of(mockConcepts));
    fixture.detectChanges();

    expect(component.conceptId).toBe('test-concept-id');
  });

     it('should get current concept observable', () => {
     stateService.getCurrentConcept.and.returnValue(of(mockConcept));
     stateService.getConcepts.and.returnValue(of(mockConcepts));
     
     // Create a new component instance to test observable initialization
     const newComponent = new ConceptDetailComponent(activatedRoute, router, stateService);
     
     expect(stateService.getCurrentConcept).toHaveBeenCalled();
     expect(newComponent.concept$).toBeDefined();
   });

  describe('Concept Loading', () => {
    it('should load and set concept when found', () => {
      stateService.getCurrentConcept.and.returnValue(of(null));
      stateService.getConcepts.and.returnValue(of(mockConcepts));
      fixture.detectChanges();

      expect(stateService.setCurrentConcept).toHaveBeenCalledWith(mockConcept);
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should redirect when concept not found', () => {
      // Set up component with non-existent concept ID
      const component2 = new ConceptDetailComponent(
        {
          snapshot: { params: { id: 'non-existent-id' } }
        } as any,
        router,
        stateService
      );

      stateService.getCurrentConcept.and.returnValue(of(null));
      stateService.getConcepts.and.returnValue(of(mockConcepts));

      component2.ngOnInit();

      expect(router.navigate).toHaveBeenCalledWith(['/concepts']);
    });

    it('should handle empty concepts array', () => {
      const component3 = new ConceptDetailComponent(
        {
          snapshot: { params: { id: 'any-id' } }
        } as any,
        router,
        stateService
      );

      stateService.getCurrentConcept.and.returnValue(of(null));
      stateService.getConcepts.and.returnValue(of([]));

      component3.ngOnInit();

      expect(router.navigate).toHaveBeenCalledWith(['/concepts']);
    });
  });

  describe('Navigation Methods', () => {
    beforeEach(() => {
      stateService.getCurrentConcept.and.returnValue(of(mockConcept));
      stateService.getConcepts.and.returnValue(of(mockConcepts));
      fixture.detectChanges();
    });

    it('should navigate back to concepts list', () => {
      component.goBack();
      expect(router.navigate).toHaveBeenCalledWith(['/concepts']);
    });

    it('should navigate to edit concept', () => {
      component.editConcept();
      expect(router.navigate).toHaveBeenCalledWith(['/concepts', 'test-concept-id', 'edit']);
    });
  });

  describe('Actions', () => {
    beforeEach(() => {
      stateService.getCurrentConcept.and.returnValue(of(mockConcept));
      stateService.getConcepts.and.returnValue(of(mockConcepts));
      fixture.detectChanges();
      spyOn(window, 'alert');
    });

    it('should show PDF export placeholder', () => {
      component.exportPDF();
      expect(window.alert).toHaveBeenCalledWith('PDF export functionality will be implemented in a future version');
    });
  });

  describe('Helper Methods', () => {
    beforeEach(() => {
      stateService.getCurrentConcept.and.returnValue(of(mockConcept));
      stateService.getConcepts.and.returnValue(of(mockConcepts));
      fixture.detectChanges();
    });

    it('should return correct status icons', () => {
      expect(component.getStatusIcon('DRAFT')).toBe('edit');
      expect(component.getStatusIcon('IN_PROGRESS')).toBe('trending_up');
      expect(component.getStatusIcon('COMPLETED')).toBe('check_circle');
      expect(component.getStatusIcon('ARCHIVED')).toBe('archive');
      expect(component.getStatusIcon('UNKNOWN')).toBe('event_note');
    });

    it('should return correct status colors', () => {
      expect(component.getStatusColor('DRAFT')).toBe('warn');
      expect(component.getStatusColor('IN_PROGRESS')).toBe('accent');
      expect(component.getStatusColor('COMPLETED')).toBe('primary');
      expect(component.getStatusColor('ARCHIVED')).toBe('');
      expect(component.getStatusColor('UNKNOWN')).toBe('');
    });

    it('should return correct status classes', () => {
      expect(component.getStatusClass('DRAFT')).toBe('status-draft');
      expect(component.getStatusClass('IN_PROGRESS')).toBe('status-in-progress');
      expect(component.getStatusClass('COMPLETED')).toBe('status-completed');
      expect(component.getStatusClass('ARCHIVED')).toBe('status-archived');
      expect(component.getStatusClass('UNKNOWN')).toBe('status-unknown');
    });
  });

  describe('Route Parameter Edge Cases', () => {
    it('should handle missing route parameter', () => {
      const component4 = new ConceptDetailComponent(
        {
          snapshot: { params: {} }
        } as any,
        router,
        stateService
      );

      expect(component4.conceptId).toBeUndefined();
    });

    it('should handle null route parameter', () => {
      const component5 = new ConceptDetailComponent(
        {
          snapshot: { params: { id: null } }
        } as any,
        router,
        stateService
      );

      expect(component5.conceptId).toBeNull();
    });
  });
}); 