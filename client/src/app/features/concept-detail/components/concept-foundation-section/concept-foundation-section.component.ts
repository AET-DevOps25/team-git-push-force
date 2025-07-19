import { Component, Input, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Concept } from '../../../../core/models/concept.model';
import { ChatResponse } from '../../../../core/models/chat.model';
import { ConceptSuggestionService } from '../../services/concept-suggestion.service';

interface FieldSuggestion {
  field: string;
  currentValue: any;
  suggestedValue: any;
  reasoning: string;
}

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
  private rejectedSuggestions = new Set<string>();

  constructor(
    private suggestionService: ConceptSuggestionService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Get field suggestion by comparing current vs suggested values
  getFieldSuggestion(field: string): FieldSuggestion | undefined {
    if (!this.suggestions?.conceptSuggestion || this.rejectedSuggestions.has(field)) return undefined;

    const conceptSuggestion = this.suggestions.conceptSuggestion;
    let currentValue: any;
    let suggestedValue: any;

    // Handle different field paths
    switch (field) {
      case 'title':
        currentValue = this.concept.title;
        suggestedValue = conceptSuggestion.title;
        break;
      case 'description':
        currentValue = this.concept.description;
        suggestedValue = conceptSuggestion.description;
        break;
      case 'eventDetails.theme':
        currentValue = this.concept.eventDetails?.theme;
        suggestedValue = conceptSuggestion.eventDetails?.theme;
        break;
      case 'eventDetails.format':
        currentValue = this.concept.eventDetails?.format;
        suggestedValue = conceptSuggestion.eventDetails?.format;
        break;
      case 'eventDetails.capacity':
        currentValue = this.concept.eventDetails?.capacity;
        suggestedValue = conceptSuggestion.eventDetails?.capacity;
        break;
      case 'eventDetails.duration':
        currentValue = this.concept.eventDetails?.duration;
        suggestedValue = conceptSuggestion.eventDetails?.duration;
        break;
      case 'eventDetails.targetAudience':
        currentValue = this.concept.eventDetails?.targetAudience;
        suggestedValue = conceptSuggestion.eventDetails?.targetAudience;
        break;
      case 'eventDetails.location':
        currentValue = this.concept.eventDetails?.location;
        suggestedValue = conceptSuggestion.eventDetails?.location;
        break;
      default:
        return undefined;
    }

    // Only return suggestion if values are different and suggested value exists
    if (suggestedValue !== undefined && suggestedValue !== currentValue) {
      return {
        field,
        currentValue: currentValue || 'Not set',
        suggestedValue,
        reasoning: conceptSuggestion.reasoning || 'AI suggestion based on your requirements'
      };
    }

    return undefined;
  }

  // Get field display name
  getFieldDisplayName(field: string): string {
    const fieldMap: { [key: string]: string } = {
      'eventDetails.format': 'Event Format',
      'eventDetails.capacity': 'Capacity',
      'eventDetails.duration': 'Duration',
      'eventDetails.theme': 'Theme',
      'eventDetails.targetAudience': 'Target Audience',
      'eventDetails.location': 'Location',
      'title': 'Title',
      'description': 'Description'
    };
    return fieldMap[field] || field;
  }

  // Accept field update
  acceptFieldUpdate(suggestion: FieldSuggestion): void {
    // Create a partial update object based on the field
    const update = { 
      field: suggestion.field, 
      suggestedValue: suggestion.suggestedValue 
    };

    this.suggestionService.acceptFieldUpdate(this.concept, update)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedConcept: Concept) => {
          this.suggestionService.updateConceptInState(updatedConcept);
          // Update the concept input to reflect the change
          this.concept = updatedConcept;
          // Remove from rejected list if it was there
          this.rejectedSuggestions.delete(suggestion.field);
          // Trigger change detection to update the UI
          this.cdr.detectChanges();
        },
        error: (error: any) => {
          console.error('Error updating concept:', error);
        }
      });
  }

  // Reject field update (mark as rejected to hide the suggestion)
  rejectFieldUpdate(suggestion: FieldSuggestion): void {
    // Add to rejected suggestions set to hide this suggestion
    this.rejectedSuggestions.add(suggestion.field);
    console.log('Rejected suggestion for field:', suggestion.field);
    // Trigger change detection to update the UI
    this.cdr.detectChanges();
  }

  // Check if section has suggestions
  hasSuggestions(): boolean {
    if (!this.suggestions?.conceptSuggestion) return false;

    const fields = [
      'title', 
      'description', 
      'eventDetails.theme', 
      'eventDetails.format', 
      'eventDetails.capacity', 
      'eventDetails.duration', 
      'eventDetails.targetAudience',
      'eventDetails.location'
    ];

    return fields.some(field => this.getFieldSuggestion(field) !== undefined);
  }
} 