import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { ChatInterfaceComponent } from './chat-interface.component';
import { ChatService } from '../../../../core/services/chat.service';
import { StateService } from '../../../../core/services/state.service';
import { ChatMessage } from '../../../../core/models/chat.model';
import { Concept } from '../../../../core/models/concept.model';

describe('ChatInterfaceComponent', () => {
  let component: ChatInterfaceComponent;
  let fixture: ComponentFixture<ChatInterfaceComponent>;
  let chatService: jasmine.SpyObj<ChatService>;
  let stateService: jasmine.SpyObj<StateService>;

  const mockConcept: Concept = {
    id: 'concept-1',
    title: 'Test Conference',
    description: 'A test conference for developers',
    status: 'DRAFT',
    agenda: [],
    speakers: [],
    tags: ['technology', 'test'],
    version: 1,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    userId: 'user1',
    lastModifiedBy: 'user1'
  };

  const mockMessages: ChatMessage[] = [
    {
      id: 'msg-1',
      role: 'user',
      content: 'Hello, can you help me plan an event?',
      timestamp: new Date('2024-01-01T10:00:00Z'),
      conversationId: 'conv-1'
    },
    {
      id: 'msg-2',
      role: 'assistant',
      content: 'Of course! I can help you plan your event. **What type of event** are you looking to organize?',
      timestamp: new Date('2024-01-01T10:01:00Z'),
      conversationId: 'conv-1'
    }
  ];

  beforeEach(async () => {
    const chatServiceSpy = jasmine.createSpyObj('ChatService', ['sendMessage', 'initializeChat', 'getCurrentMessages']);
    const stateServiceSpy = jasmine.createSpyObj('StateService', ['getCurrentConcept', 'getConcepts', 'setCurrentConcept', 'areConceptsLoaded', 'isLoading', 'getChatMessages']);

    // Configure mock return values
    chatServiceSpy.sendMessage.and.returnValue(of({ response: 'Test response', suggestions: [], followUpQuestions: [], confidence: 0.9 }));
    chatServiceSpy.initializeChat.and.returnValue(of({ messages: [] }));
    chatServiceSpy.getCurrentMessages.and.returnValue(of([]));
    stateServiceSpy.getCurrentConcept.and.returnValue(of(mockConcept));
    stateServiceSpy.getConcepts.and.returnValue(of([mockConcept]));
    stateServiceSpy.areConceptsLoaded.and.returnValue(false);
    stateServiceSpy.isLoading.and.returnValue(of(false));
    stateServiceSpy.getChatMessages.and.returnValue(of(mockMessages));

    await TestBed.configureTestingModule({
      imports: [
        ChatInterfaceComponent,
        ReactiveFormsModule,
        NoopAnimationsModule,
        HttpClientTestingModule
      ],
      providers: [
        { provide: ChatService, useValue: chatServiceSpy },
        { provide: StateService, useValue: stateServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ChatInterfaceComponent);
    component = fixture.componentInstance;
    chatService = TestBed.inject(ChatService) as jasmine.SpyObj<ChatService>;
    stateService = TestBed.inject(StateService) as jasmine.SpyObj<StateService>;
    
    // Set required input
    component.concept = mockConcept;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.messages).toEqual([]);
    expect(component.isLoading).toBe(false);
    expect(component.maxMessageLength).toBe(2000);
    expect(component.placeholder).toBe('Ask me anything about your event concept...');
    expect(component.inputRows).toBe(1);
  });

  it('should accept input properties', () => {
    component.messages = mockMessages;
    component.isLoading = true;
    component.maxMessageLength = 1000;
    component.placeholder = 'Custom placeholder';

    expect(component.messages.length).toBe(2);
    expect(component.isLoading).toBe(true);
    expect(component.maxMessageLength).toBe(1000);
    expect(component.placeholder).toBe('Custom placeholder');
  });

  describe('Form Control', () => {
    it('should initialize message control with validators', () => {
      fixture.detectChanges();
      
      expect(component.messageControl.value).toBe('');
      expect(component.messageControl.hasError('required')).toBeTruthy();
    });

         it('should validate max length', () => {
       component.maxMessageLength = 10;
       // Recreate control with new max length
       component.messageControl = new FormControl('', [
         Validators.required,
         Validators.maxLength(component.maxMessageLength)
       ]);
       
       component.messageControl.setValue('This is a very long message that exceeds the limit');
       expect(component.messageControl.hasError('maxlength')).toBeTruthy();

       component.messageControl.setValue('Short');
       expect(component.messageControl.hasError('maxlength')).toBeFalsy();
     });

    it('should be valid with proper content', () => {
      fixture.detectChanges();
      
      component.messageControl.setValue('Valid message');
      expect(component.messageControl.valid).toBeTruthy();
    });
  });

  describe('Message Sending', () => {
    beforeEach(() => {
      fixture.detectChanges();
      spyOn(component.messageSent, 'emit');
    });

         it('should send message when valid', () => {
       component.messageControl.setValue('Test message');
       
       component.sendMessage();
       
       expect(component.messageSent.emit).toHaveBeenCalledWith('Test message');
       expect(component.messageControl.value).toBe(null); // reset() sets to null
       expect(component.inputRows).toBe(1);
     });

    it('should not send empty message', () => {
      component.messageControl.setValue('   ');
      
      component.sendMessage();
      
      expect(component.messageSent.emit).not.toHaveBeenCalled();
    });

    it('should not send when loading', () => {
      component.isLoading = true;
      component.messageControl.setValue('Test message');
      
      component.sendMessage();
      
      expect(component.messageSent.emit).not.toHaveBeenCalled();
    });

    it('should not send when form is invalid', () => {
      component.messageControl.setValue('');
      
      component.sendMessage();
      
      expect(component.messageSent.emit).not.toHaveBeenCalled();
    });


  });

  describe('Can Send Message Logic', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return true when conditions are met', () => {
      component.isLoading = false;
      component.messageControl.setValue('Valid message');
      
      expect(component.canSendMessage()).toBe(true);
    });

    it('should return false when loading', () => {
      component.isLoading = true;
      component.messageControl.setValue('Valid message');
      
      expect(component.canSendMessage()).toBe(false);
    });

    it('should return false when form is invalid', () => {
      component.isLoading = false;
      component.messageControl.setValue('');
      
      expect(component.canSendMessage()).toBe(false);
    });

    it('should return false when message is only whitespace', () => {
      component.isLoading = false;
      component.messageControl.setValue('   ');
      
      expect(component.canSendMessage()).toBe(false);
    });

    it('should return false when message control value is null', () => {
      component.isLoading = false;
      component.messageControl.setValue(null);
      
      expect(component.canSendMessage()).toBe(false);
    });
  });

  describe('Keyboard Events', () => {
    beforeEach(() => {
      fixture.detectChanges();
      spyOn(component, 'sendMessage');
    });

    it('should send message on Enter key', () => {
      const event = new KeyboardEvent('keydown', { key: 'Enter', shiftKey: false });
      spyOn(event, 'preventDefault');
      
      component.onEnterKey(event);
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.sendMessage).toHaveBeenCalled();
    });

    it('should not send message on Shift+Enter', () => {
      const event = new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true });
      spyOn(event, 'preventDefault');
      
      component.onEnterKey(event);
      
      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(component.sendMessage).not.toHaveBeenCalled();
    });

    it('should not send message on other keys', () => {
      const event = new KeyboardEvent('keydown', { key: 'Space', shiftKey: false });
      spyOn(event, 'preventDefault');
      
      component.onEnterKey(event);
      
      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(component.sendMessage).not.toHaveBeenCalled();
    });
  });

  describe('Textarea Height Adjustment', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should adjust height for single line', () => {
      // Mock textarea element
      component.messageTextarea = {
        nativeElement: {
          value: 'Single line message'
        }
      } as any;
      
      component.adjustTextareaHeight();
      
      expect(component.inputRows).toBe(1);
    });

    it('should adjust height for multiple lines', () => {
      component.messageTextarea = {
        nativeElement: {
          value: 'First line\nSecond line\nThird line'
        }
      } as any;
      
      component.adjustTextareaHeight();
      
      expect(component.inputRows).toBe(3);
    });

    it('should limit to max lines', () => {
      component.messageTextarea = {
        nativeElement: {
          value: 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5\nLine 6'
        }
      } as any;
      
      component.adjustTextareaHeight();
      
      expect(component.inputRows).toBe(4); // Max is 4
    });

    it('should handle missing textarea element', () => {
      component.messageTextarea = undefined as any;
      
      expect(() => component.adjustTextareaHeight()).not.toThrow();
    });

    it('should handle textarea with undefined value', () => {
      component.messageTextarea = {
        nativeElement: {
          value: undefined
        }
      } as any;
      
      expect(() => component.adjustTextareaHeight()).not.toThrow();
    });
  });

  describe('Event Emissions', () => {
    beforeEach(() => {
      fixture.detectChanges();
      spyOn(component.chatCleared, 'emit');
      spyOn(component.chatExported, 'emit');
    });

    it('should emit chat cleared event', () => {
      component.clearChat();
      expect(component.chatCleared.emit).toHaveBeenCalled();
    });

    it('should emit chat exported event with messages', () => {
      component.messages = mockMessages;
      
      component.exportChat();
      
      expect(component.chatExported.emit).toHaveBeenCalledWith(mockMessages);
    });
  });

  describe('Message Formatting', () => {
    it('should format bold text', () => {
      const result = component.formatMessage('This is **bold** text');
      expect(result).toBe('This is <strong>bold</strong> text');
    });

    it('should format italic text', () => {
      const result = component.formatMessage('This is *italic* text');
      expect(result).toBe('This is <em>italic</em> text');
    });

    it('should format line breaks', () => {
      const result = component.formatMessage('Line 1\nLine 2');
      expect(result).toBe('Line 1<br>Line 2');
    });

    it('should format combined markdown', () => {
      const result = component.formatMessage('**Bold** and *italic*\nNew line');
      expect(result).toBe('<strong>Bold</strong> and <em>italic</em><br>New line');
    });

    it('should handle empty content', () => {
      const result = component.formatMessage('');
      expect(result).toBe('');
    });
  });



  describe('Tracking Functions', () => {
    it('should track messages by ID', () => {
      const message = mockMessages[0];
      const result = component.trackByMessage(0, message);
      expect(result).toBe('msg-1');
    });

    it('should track messages without ID', () => {
      const message = { ...mockMessages[0] };
      delete (message as any).id;
      const result = component.trackByMessage(1, message);
      expect(result).toBe('user-1');
    });
  });

  describe('Scrolling', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should handle scroll to bottom with valid element', () => {
      component.messagesContainer = {
        nativeElement: {
          scrollHeight: 1000,
          scrollTop: 0
        }
      } as any;
      
      expect(() => component['scrollToBottom']()).not.toThrow();
    });

    it('should handle scroll to bottom with missing element', () => {
      component.messagesContainer = undefined as any;
      
      expect(() => component['scrollToBottom']()).not.toThrow();
    });

    it('should handle scroll errors gracefully', () => {
      component.messagesContainer = {
        nativeElement: {
          get scrollHeight() { throw new Error('Test error'); }
        }
      } as any;
      
      spyOn(console, 'error');
      
      expect(() => component['scrollToBottom']()).not.toThrow();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('Component Lifecycle', () => {
    it('should set up form value changes subscription on init', () => {
      spyOn(component.messageControl.valueChanges, 'pipe').and.returnValue(component.messageControl.valueChanges);
      spyOn(component.messageControl.valueChanges, 'subscribe');
      
      component.ngOnInit();
      
      expect(component.messageControl.valueChanges.pipe).toHaveBeenCalled();
    });

    it('should destroy subscription on destroy', () => {
      spyOn(component['destroy$'], 'next');
      spyOn(component['destroy$'], 'complete');
      
      component.ngOnDestroy();
      
      expect(component['destroy$'].next).toHaveBeenCalled();
      expect(component['destroy$'].complete).toHaveBeenCalled();
    });

    it('should scroll to bottom after view checked when flag is set', () => {
      component['shouldScrollToBottom'] = true;
      spyOn(component as any, 'scrollToBottom');
      
      component.ngAfterViewChecked();
      
      expect(component['scrollToBottom']).toHaveBeenCalled();
      expect(component['shouldScrollToBottom']).toBe(false);
    });

    it('should not scroll to bottom when flag is false', () => {
      component['shouldScrollToBottom'] = false;
      spyOn(component as any, 'scrollToBottom');
      
      component.ngAfterViewChecked();
      
      expect(component['scrollToBottom']).not.toHaveBeenCalled();
    });
  });
}); 