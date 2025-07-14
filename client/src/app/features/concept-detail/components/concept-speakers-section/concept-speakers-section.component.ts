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
  selector: 'app-concept-speakers-section',
  standalone: true,
  imports: [
    CommonModule,
    MatExpansionModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './concept-speakers-section.component.html',
  styleUrl: './concept-speakers-section.component.scss'
})
export class ConceptSpeakersSectionComponent implements OnDestroy {
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

  // Get suggested speakers
  getSuggestedSpeakers(): any[] {
    return this.suggestions?.conceptSuggestion?.speakers || [];
  }

  // Accept speaker suggestion
  acceptSpeaker(speaker: any): void {
    this.suggestionService.acceptSpeaker(this.concept, speaker)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedConcept: Concept) => {
          this.suggestionService.updateConceptInState(updatedConcept);
          this.clearSuggestion('speaker', speaker);
        },
        error: (error: any) => {
          console.error('Error updating concept:', error);
        }
      });
  }

  // Reject speaker suggestion
  rejectSpeaker(speaker: any): void {
    this.clearSuggestion('speaker', speaker);
  }

  // Check if section is complete
  isComplete(): boolean {
    return !!(this.concept.speakers?.length);
  }

  // Check if section has suggestions
  hasSuggestions(): boolean {
    return !!(this.suggestions?.conceptSuggestion?.speakers?.length);
  }

  // Clear suggestion
  private clearSuggestion(type: string, item: any): void {
    if (!this.suggestions) return;
    
    if (type === 'speaker' && this.suggestions.conceptSuggestion?.speakers) {
      this.suggestions.conceptSuggestion.speakers = 
        this.suggestions.conceptSuggestion.speakers.filter(s => s !== item);
    }
  }
} 