import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TextFieldModule } from '@angular/cdk/text-field';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ChatMessage, ChatRequest, ChatResponse } from '../../../../core/models';
import { Concept } from '../../../../core/models/concept.model';
import { ChatService, StateService } from '../../../../core/services';

@Component({
  selector: 'app-chat-interface',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    TextFieldModule
  ],
  templateUrl: './chat-interface.component.html',
  styleUrl: './chat-interface.component.scss'
})
export class ChatInterfaceComponent implements OnInit, OnDestroy, AfterViewChecked {
  @Input() concept!: Concept;
  @Input() conversationId?: string;
  @Input() maxMessageLength: number = 2000;
  @Input() placeholder: string = 'Ask me anything about your event concept...';
  
  @Output() messageSent = new EventEmitter<string>();
  @Output() chatCleared = new EventEmitter<void>();
  @Output() chatExported = new EventEmitter<ChatMessage[]>();
  @Output() suggestionsReceived = new EventEmitter<ChatResponse>();
  
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  @ViewChild('messageTextarea') messageTextarea!: ElementRef;
  
  messages: ChatMessage[] = [];
  isLoading: boolean = false;
  latestChatResponse?: ChatResponse;
  
  messageControl = new FormControl('', [
    Validators.required,
    Validators.maxLength(this.maxMessageLength)
  ]);
  
  inputRows = 1;
  private destroy$ = new Subject<void>();
  private shouldScrollToBottom = true;

  constructor(
    private chatService: ChatService,
    private stateService: StateService
  ) {}

  ngOnInit(): void {
    this.messageControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.adjustTextareaHeight();
      });

    // Subscribe to chat messages from state
    const currentConversationId = this.conversationId || this.concept?.id;
    
    this.stateService.getChatMessages(currentConversationId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(messages => {
        this.messages = messages;
        this.shouldScrollToBottom = true;
        
        // Add welcome message if this is the first time and no messages exist
        if (messages.length === 0 && currentConversationId) {
          this.addWelcomeMessage(currentConversationId);
        }
      });

    // Subscribe to loading state
    this.stateService.isLoading('chat')
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.isLoading = loading;
      });
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  sendMessage(): void {
    if (this.canSendMessage()) {
      const message = this.messageControl.value?.trim();
      if (message && this.concept) {
        const currentConversationId = this.conversationId || this.concept.id;
        this.chatService.sendMessage(message, this.concept, currentConversationId).subscribe({
          next: (response) => {
            this.latestChatResponse = response;
            this.suggestionsReceived.emit(response);
            this.messageSent.emit(message);
            this.messageControl.reset();
            this.inputRows = 1;
            this.shouldScrollToBottom = true;
          },
          error: (error) => {
            console.error('Error sending message:', error);
            // TODO: Show user-friendly error message
          }
        });
      }
    }
  }

  clearChat(): void {
    this.chatCleared.emit();
  }

  exportChat(): void {
    this.chatExported.emit(this.messages);
  }



  onEnterKey(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      if (event.shiftKey) {
        // Allow new line with Shift+Enter
        return;
      } else {
        // Send message with Enter
        event.preventDefault();
        this.sendMessage();
      }
    }
  }

  adjustTextareaHeight(): void {
    const textarea = this.messageTextarea?.nativeElement;
    if (textarea && textarea.value !== undefined) {
      const lineHeight = 24; // Approximate line height
      const maxLines = 4;
      const lines = (textarea.value.match(/\n/g) || []).length + 1;
      this.inputRows = Math.min(Math.max(lines, 1), maxLines);
    }
  }

  canSendMessage(): boolean {
    return !this.isLoading && 
           this.messageControl.valid && 
           (this.messageControl.value?.trim().length || 0) > 0;
  }

  formatMessage(content: string): string {
    // Basic markdown-like formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  }

  trackByMessage(index: number, message: ChatMessage): string {
    return message.id || `${message.role}-${index}`;
  }

  private addWelcomeMessage(conversationId: string): void {
    const welcomeMessage: ChatMessage = {
      id: `welcome-${Date.now()}`,
      role: 'assistant',
      content: 'Hi! I\'m your AI assistant for event conceptualization. I can help you brainstorm event ideas, refine concepts, suggest speakers, and provide feedback on your event plans. What would you like to work on today?',
      timestamp: new Date(),
      conversationId: conversationId
    };
    
    this.stateService.addChatMessage(welcomeMessage);
  }

  private scrollToBottom(): void {
    try {
      const element = this.messagesContainer?.nativeElement;
      if (element) {
        element.scrollTop = element.scrollHeight;
      }
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }
} 