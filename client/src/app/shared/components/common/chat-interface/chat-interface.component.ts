import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ChatMessage, ChatRequest } from '../../../../core/models';

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
    MatChipsModule,
    MatTooltipModule
  ],
  templateUrl: './chat-interface.component.html',
  styleUrl: './chat-interface.component.scss'
})
export class ChatInterfaceComponent implements OnInit, OnDestroy, AfterViewChecked {
  @Input() messages: ChatMessage[] = [];
  @Input() suggestions: string[] = [];
  @Input() isLoading: boolean = false;
  @Input() maxMessageLength: number = 2000;
  @Input() placeholder: string = 'Ask me anything about your event concept...';
  
  @Output() messageSent = new EventEmitter<string>();
  @Output() chatCleared = new EventEmitter<void>();
  @Output() chatExported = new EventEmitter<ChatMessage[]>();
  
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  @ViewChild('messageTextarea') messageTextarea!: ElementRef;
  
  messageControl = new FormControl('', [
    Validators.required,
    Validators.maxLength(this.maxMessageLength)
  ]);
  
  inputRows = 1;
  private destroy$ = new Subject<void>();
  private shouldScrollToBottom = true;

  ngOnInit(): void {
    this.messageControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.adjustTextareaHeight();
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
      if (message) {
        this.messageSent.emit(message);
        this.messageControl.reset();
        this.inputRows = 1;
        this.shouldScrollToBottom = true;
      }
    }
  }

  sendSuggestion(suggestion: string): void {
    this.messageSent.emit(suggestion);
    this.shouldScrollToBottom = true;
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

  formatTime(timestamp: Date): string {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  trackByMessage(index: number, message: ChatMessage): string {
    return message.id || `${message.role}-${index}`;
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