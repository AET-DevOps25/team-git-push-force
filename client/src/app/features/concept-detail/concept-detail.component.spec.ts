import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ChangeDetectorRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { ConceptDetailComponent } from './concept-detail.component';
import { StateService } from '../../core/services/state.service';
import { ConceptService } from '../../core/services/concept.service';
import { ChatService } from '../../core/services/chat.service';
import { DocumentService } from '../../core/services/document.service';
import { Concept } from '../../core/models/concept.model';

describe('ConceptDetailComponent', () => {
  let component: ConceptDetailComponent;
  let fixture: ComponentFixture<ConceptDetailComponent>;
  let stateService: jasmine.SpyObj<StateService>;
  let conceptService: jasmine.SpyObj<ConceptService>;
  let chatService: jasmine.SpyObj<ChatService>;
  let documentService: jasmine.SpyObj<DocumentService>;
  let dialog: jasmine.SpyObj<MatDialog>;
  let cdr: jasmine.SpyObj<ChangeDetectorRef>;
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
    const stateServiceSpy = jasmine.createSpyObj('StateService', [
      'getCurrentConcept', 
      'getConcepts', 
      'setCurrentConcept', 
      'areConceptsLoaded',
      'getChatMessages',
      'getUser',
      'isLoading',
      'getError'
    ]);
    const conceptServiceSpy = jasmine.createSpyObj('ConceptService', ['getConceptById', 'updateConcept', 'downloadConceptPdf']);
    const chatServiceSpy = jasmine.createSpyObj('ChatService', ['sendMessage', 'initializeChat']);
    const documentServiceSpy = jasmine.createSpyObj('DocumentService', ['getConceptDocuments', 'uploadDocument', 'deleteDocument']);
    const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    const cdrSpy = jasmine.createSpyObj('ChangeDetectorRef', ['markForCheck', 'detectChanges']);

    await TestBed.configureTestingModule({
      imports: [
        ConceptDetailComponent,
        RouterTestingModule,
        NoopAnimationsModule,
        HttpClientTestingModule
      ],
      providers: [
        { provide: StateService, useValue: stateServiceSpy },
        { provide: ConceptService, useValue: conceptServiceSpy },
        { provide: ChatService, useValue: chatServiceSpy },
        { provide: DocumentService, useValue: documentServiceSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: ChangeDetectorRef, useValue: cdrSpy },
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
    conceptService = TestBed.inject(ConceptService) as jasmine.SpyObj<ConceptService>;
    chatService = TestBed.inject(ChatService) as jasmine.SpyObj<ChatService>;
    documentService = TestBed.inject(DocumentService) as jasmine.SpyObj<DocumentService>;
    dialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
    cdr = TestBed.inject(ChangeDetectorRef) as jasmine.SpyObj<ChangeDetectorRef>;
    router = TestBed.inject(Router);
    activatedRoute = TestBed.inject(ActivatedRoute);
    spyOn(router, 'navigate');

    // Configure conceptService mock return values
    conceptService.downloadConceptPdf.and.returnValue(of(new Blob(['fake pdf content'], { type: 'application/pdf' })));
    
    // Configure default stateService return values to prevent undefined observable errors
    stateService.getCurrentConcept.and.returnValue(of(null));
    stateService.getConcepts.and.returnValue(of([]));
    stateService.areConceptsLoaded.and.returnValue(false);
    stateService.getChatMessages.and.returnValue(of([]));
    stateService.getUser.and.returnValue(of(null));
    stateService.isLoading.and.returnValue(of(false));
    stateService.getError.and.returnValue(of(null));

    // Configure chatService mock return values
    const mockChatResponse = {
      response: 'test response',
      suggestions: ['suggestion 1', 'suggestion 2'],
      followUpQuestions: ['question 1', 'question 2'],
      confidence: 0.8
    };
    chatService.sendMessage.and.returnValue(of(mockChatResponse));
    chatService.initializeChat.and.returnValue(of({ 
      message: 'Welcome to chat', 
      suggestions: ['suggestion 1'], 
      conversationId: 'test-conversation-id' 
    }));
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

  it('should have concept property', () => {
    stateService.getCurrentConcept.and.returnValue(of(mockConcept));
    stateService.getConcepts.and.returnValue(of(mockConcepts));
    
    expect(component.concept).toBeDefined();
  });

  describe('Concept Loading', () => {
    it('should load and set concept when found', async () => {
      stateService.getCurrentConcept.and.returnValue(of(null));
      stateService.getConcepts.and.returnValue(of(mockConcepts));
      
      component.ngOnInit();
      
      // Wait for the observable chain to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(component.concept).toEqual(mockConcept);
    });

    it('should redirect when concept not found', async () => {
      stateService.getCurrentConcept.and.returnValue(of(null));
      stateService.getConcepts.and.returnValue(of([])); // Empty array - no concepts
      stateService.areConceptsLoaded.and.returnValue(true);
      
      component.ngOnInit();
      
      // Wait for the observable chain and redirect logic
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(router.navigate).toHaveBeenCalledWith(['/concepts']);
    });

    it('should handle empty concepts array', async () => {
      stateService.getCurrentConcept.and.returnValue(of(null));
      stateService.getConcepts.and.returnValue(of([])); // Empty concepts
      stateService.areConceptsLoaded.and.returnValue(true);
      
      component.ngOnInit();
      
      // Wait for the observable chain and redirect logic
      await new Promise(resolve => setTimeout(resolve, 100));

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
    });

    it('should download PDF when exportPDF is called', () => {
      // Mock URL.createObjectURL and revokeObjectURL
      spyOn(window.URL, 'createObjectURL').and.returnValue('mock-blob-url');
      spyOn(window.URL, 'revokeObjectURL');
      spyOn(document, 'createElement').and.callThrough();
      spyOn(document.body, 'appendChild');
      spyOn(document.body, 'removeChild');

      component.exportPDF();

      expect(conceptService.downloadConceptPdf).toHaveBeenCalledWith(component.conceptId);
      expect(window.URL.createObjectURL).toHaveBeenCalled();
    });

    it('should open documents dialog when openDocumentsDialog is called', () => {
      component.openDocumentsDialog();

      expect(dialog.open).toHaveBeenCalledWith(jasmine.any(Function), {
        width: '600px',
        maxWidth: '90vw',
        maxHeight: '80vh',
        disableClose: false,
        data: {
          conceptId: 'test-concept-id',
          conceptTitle: 'Test Conference'
        },
        panelClass: 'documents-dialog-panel'
      });
    });

    it('should not open documents dialog when concept is null', () => {
      stateService.getCurrentConcept.and.returnValue(of(null));
      component.concept = null;

      component.openDocumentsDialog();

      expect(dialog.open).not.toHaveBeenCalled();
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
      // Test using the existing component instance
      const testRoute = {
        snapshot: { params: {} }
      } as any;
      
      // Create a new component with missing parameter
      const testComponent = new ConceptDetailComponent(
        testRoute,
        router,
        stateService,
        conceptService,
        chatService,
        cdr,
        dialog
      );

      expect(testComponent.conceptId).toBeUndefined();
    });

    it('should handle null route parameter', () => {
      const testRoute = {
        snapshot: { params: { id: null } }
      } as any;
      
      const testComponent = new ConceptDetailComponent(
        testRoute,
        router,
        stateService,
        conceptService,
        chatService,
        cdr,
        dialog
      );

      expect(testComponent.conceptId).toBeNull();
    });
  });
}); 