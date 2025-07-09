import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { DashboardComponent } from './dashboard.component';
import { StateService } from '../../core/services/state.service';
import { Concept } from '../../core/models/concept.model';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let stateService: jasmine.SpyObj<StateService>;
  let router: Router;

  const mockConcepts: Concept[] = [
    {
      id: '1',
      title: 'Test Conference',
      description: 'A test conference',
      status: 'IN_PROGRESS',
      agenda: [],
      speakers: [],
      tags: ['test'],
      version: 1,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      userId: 'user1',
      lastModifiedBy: 'user1'
    },
    {
      id: '2',
      title: 'Completed Event',
      description: 'A completed event',
      status: 'COMPLETED',
      agenda: [],
      speakers: [],
      tags: ['test'],
      version: 1,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      userId: 'user1',
      lastModifiedBy: 'user1'
    }
  ];

  beforeEach(async () => {
    const stateServiceSpy = jasmine.createSpyObj('StateService', ['getUser', 'getConcepts', 'setConcepts']);

    // Setup default return values
    stateServiceSpy.getUser.and.returnValue(of(null));
    stateServiceSpy.getConcepts.and.returnValue(of(mockConcepts));

    await TestBed.configureTestingModule({
      imports: [
        DashboardComponent,
        RouterTestingModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: StateService, useValue: stateServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    stateService = TestBed.inject(StateService) as jasmine.SpyObj<StateService>;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize observables', () => {
    expect(component.user$).toBeDefined();
    expect(component.concepts$).toBeDefined();
    expect(component.conceptsCount$).toBeDefined();
    expect(component.inProgressCount$).toBeDefined();
    expect(component.completedCount$).toBeDefined();
    expect(component.recentConcepts$).toBeDefined();
  });

  describe('Navigation Methods', () => {
    it('should navigate to create concept', () => {
      component.createConcept();
      expect(router.navigate).toHaveBeenCalledWith(['/concepts/create']);
    });

    it('should navigate to view all concepts', () => {
      component.viewAllConcepts();
      expect(router.navigate).toHaveBeenCalledWith(['/concepts']);
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
      expect(component.getStatusIcon('DRAFT')).toBe('edit_note');
      expect(component.getStatusIcon('IN_PROGRESS')).toBe('hourglass_top');
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

    it('should return correct status display names', () => {
      expect(component.getStatusDisplayName('IN_PROGRESS')).toBe('In Progress');
      expect(component.getStatusDisplayName('COMPLETED')).toBe('Completed');
      expect(component.getStatusDisplayName('DRAFT')).toBe('Draft');
      expect(component.getStatusDisplayName('ARCHIVED')).toBe('Archived');
    });

    it('should track concepts by id', () => {
      const concept = mockConcepts[0];
      expect(component.trackByConcept(0, concept)).toBe(concept.id);
    });
  });

  describe('Action Methods', () => {
    it('should handle share concept', () => {
      const mockEvent = { stopPropagation: jasmine.createSpy('stopPropagation') } as any;
      spyOn(console, 'log');
      
      component.shareConcept(mockEvent, 'test-id');
      
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith('Share concept:', 'test-id');
    });
  });

  it('should call setConcepts on init', () => {
    component.ngOnInit();
    expect(stateService.setConcepts).toHaveBeenCalled();
  });
}); 