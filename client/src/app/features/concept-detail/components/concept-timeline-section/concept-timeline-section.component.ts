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
  selector: 'app-concept-timeline-section',
  standalone: true,
  imports: [
    CommonModule,
    MatExpansionModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './concept-timeline-section.component.html',
  styleUrl: './concept-timeline-section.component.scss'
})
export class ConceptTimelineSectionComponent implements OnDestroy {
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

  // Format agenda time
  formatAgendaTime(time: string): string {
    return time || 'TBD';
  }

  // Get agenda type icon
  getAgendaTypeIcon(type: string): string {
    switch (type) {
      case 'KEYNOTE': return 'mic';
      case 'WORKSHOP': return 'build';
      case 'PANEL': return 'group';
      case 'NETWORKING': return 'people';
      case 'BREAK': return 'coffee';
      case 'LUNCH': return 'restaurant';
      default: return 'event';
    }
  }

  // Format duration
  formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes}min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
  }

  // Get suggested agenda items
  getSuggestedAgendaItems(): any[] {
    return this.suggestions?.conceptSuggestion?.agenda || [];
  }

  // Get suggestion for editing existing agenda item
  getAgendaItemSuggestion(agendaItem: any): any {
    if (!this.suggestions?.conceptUpdates?.suggestions || !this.concept) return null;
    
    // Find the index of this agenda item in the current concept
    const itemIndex = this.concept.agenda.findIndex(item => item.id === agendaItem.id);
    if (itemIndex === -1) return null;
    
    // Look for suggestions specifically for this agenda item index
    return this.suggestions.conceptUpdates.suggestions.find(s => 
      s.field === `agenda[${itemIndex}].duration`
    );
  }

  // Accept agenda item suggestion
  acceptAgendaItem(agendaItem: any): void {
    this.suggestionService.acceptAgendaItem(this.concept, agendaItem)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedConcept: Concept) => {
          this.suggestionService.updateConceptInState(updatedConcept);
          this.clearSuggestion('agenda', agendaItem);
        },
        error: (error: any) => {
          console.error('Error updating concept:', error);
        }
      });
  }

  // Reject agenda item suggestion
  rejectAgendaItem(agendaItem: any): void {
    this.clearSuggestion('agenda', agendaItem);
  }

  // Accept agenda item modification
  acceptAgendaItemEdit(agendaItem: any, update: any): void {
    this.suggestionService.acceptAgendaItemEdit(this.concept, agendaItem, update)
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

  // Reject agenda item field update
  rejectFieldUpdate(update: any): void {
    this.clearSuggestion('update', update);
  }

  // Check if section has suggestions
  hasSuggestions(): boolean {
    return !!(this.suggestions?.conceptSuggestion?.agenda?.length ||
             this.suggestions?.conceptUpdates?.suggestions?.some(s => s.field.includes('agenda')));
  }

  // Clear suggestion
  private clearSuggestion(type: string, item: any): void {
    if (!this.suggestions) return;
    
    if (type === 'agenda' && this.suggestions.conceptSuggestion?.agenda) {
      this.suggestions.conceptSuggestion.agenda = 
        this.suggestions.conceptSuggestion.agenda.filter(a => a !== item);
    } else if (type === 'update' && this.suggestions.conceptUpdates) {
      this.suggestions.conceptUpdates.suggestions = 
        this.suggestions.conceptUpdates.suggestions.filter(s => s !== item);
    }
  }
} 