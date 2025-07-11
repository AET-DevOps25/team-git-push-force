import { Component, Input, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Concept } from '../../../../core/models/concept.model';
import { ChatResponse } from '../../../../core/models/chat.model';
import { ConceptSuggestionService } from '../../services/concept-suggestion.service';

@Component({
  selector: 'app-concept-foundation-section',
  standalone: true,
  imports: [
    CommonModule,
    MatExpansionModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './concept-foundation-section.component.html',
  styleUrl: './concept-foundation-section.component.scss'
})
export class ConceptFoundationSectionComponent implements OnDestroy {
  @Input() concept!: Concept;
  @Input() suggestions?: ChatResponse;
  @Input() expanded: boolean = false;

  private destroy$ = new Subject<void>();

  constructor(
    private suggestionService: ConceptSuggestionService
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Get field suggestion
  getFieldSuggestion(field: string): any {
    return this.suggestions?.conceptUpdates?.suggestions?.find(s => s.field === field);
  }

  // Get field display name
  getFieldDisplayName(field: string): string {
    const fieldMap: { [key: string]: string } = {
      'eventDetails.format': 'Event Format',
      'eventDetails.capacity': 'Capacity',
      'eventDetails.duration': 'Duration',
      'eventDetails.theme': 'Theme',
      'eventDetails.targetAudience': 'Target Audience',
      'title': 'Title',
      'description': 'Description'
    };
    return fieldMap[field] || field;
  }

  // Accept field update
  acceptFieldUpdate(update: any): void {
    this.suggestionService.acceptFieldUpdate(this.concept, update)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedConcept: Concept) => {
          this.suggestionService.updateConceptInState(updatedConcept);
          this.clearSuggestion('update', update);
        },
        error: (error: any) => {
          console.error('Error updating concept:', error);
        }
      });
  }

  // Reject field update
  rejectFieldUpdate(update: any): void {
    this.clearSuggestion('update', update);
  }

  // Check if section is complete
  isComplete(): boolean {
    return !!(this.concept.eventDetails?.theme && 
             this.concept.eventDetails?.objectives?.length &&
             this.concept.eventDetails?.targetAudience);
  }

  // Check if section has suggestions
  hasSuggestions(): boolean {
    return !!(this.suggestions?.conceptUpdates?.suggestions?.some(s =>
      s.field.includes('eventDetails.') || s.field === 'title' || s.field === 'description'
    ));
  }

  // Clear suggestion
  private clearSuggestion(type: string, item: any): void {
    if (!this.suggestions) return;
    
    if (type === 'update' && this.suggestions.conceptUpdates) {
      this.suggestions.conceptUpdates.suggestions = 
        this.suggestions.conceptUpdates.suggestions.filter(s => s !== item);
    }
  }
} 