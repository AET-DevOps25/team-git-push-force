import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';
import { StateService } from '../../core/services/state.service';
import { ConceptService } from '../../core/services/concept.service';
import { Concept } from '../../core/models/concept.model';
import { ChatResponse, ConceptSuggestion, ConceptUpdates } from '../../core/models/chat.model';
import { ChatInterfaceComponent } from '../../shared/components/common/chat-interface/chat-interface.component';
import { Observable, Subject, combineLatest } from 'rxjs';
import { map, takeUntil, filter, take } from 'rxjs/operators';

@Component({
  selector: 'app-concept-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatChipsModule,
    MatExpansionModule,
    MatDividerModule,
    ChatInterfaceComponent
  ],
  templateUrl: './concept-detail.component.html',
  styleUrl: './concept-detail.component.scss'
})
export class ConceptDetailComponent implements OnInit, OnDestroy {
  concept$: Observable<Concept | null>;
  conceptId: string;
  currentSuggestions?: ChatResponse;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private stateService: StateService,
    private conceptService: ConceptService
  ) {
    this.conceptId = this.route.snapshot.params['id'];
    
    // Set up concept observable that automatically finds the concept by ID
    this.concept$ = combineLatest([
      this.stateService.getConcepts(),
      this.stateService.getCurrentConcept()
    ]).pipe(
      map(([concepts, currentConcept]) => {
        // If current concept matches our ID, use it
        if (currentConcept?.id === this.conceptId) {
          return currentConcept;
        }
        
        // Otherwise find it in the concepts list
        const foundConcept = concepts.find(c => c.id === this.conceptId);
        if (foundConcept && foundConcept.id !== currentConcept?.id) {
          // Set it as current concept if it's different
          this.stateService.setCurrentConcept(foundConcept);
        }
        
        return foundConcept || null;
      }),
      takeUntil(this.destroy$)
    );
  }

  ngOnInit(): void {
    // Check if concept exists, if not redirect
    this.concept$.pipe(
      filter(concept => concept === null), // Only emit when concept is definitely null (after loading)
      takeUntil(this.destroy$)
    ).subscribe(() => {
      // Only redirect if concepts are loaded but concept is still not found
      if (this.stateService.areConceptsLoaded()) {
        this.router.navigate(['/concepts']);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  goBack(): void {
    this.router.navigate(['/concepts']);
  }

  editConcept(): void {
    this.router.navigate(['/concepts', this.conceptId, 'edit']);
  }

  exportPDF(): void {
    this.conceptService.downloadConceptPdf(this.conceptId).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `concept-${this.conceptId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      },
      error: (error: any) => {
        console.error('Error downloading PDF:', error);
        alert('Failed to download PDF. Please try again.');
      }
    });
  }

  onSuggestionsReceived(suggestions: ChatResponse): void {
    this.currentSuggestions = suggestions;
  }

  acceptFieldUpdate(update: any): void {
    this.concept$.pipe(
      takeUntil(this.destroy$),
      take(1)
    ).subscribe(concept => {
      if (!concept) return;
      
      const updatedConcept = { ...concept };
      this.applyFieldUpdate(updatedConcept, update.field, update.suggestedValue);
      
      this.conceptService.updateConcept(concept.id, updatedConcept).subscribe({
        next: (updated: Concept) => {
          this.stateService.updateConcept(updated);
          this.clearSuggestion('update', update);
        },
        error: (error: any) => {
          console.error('Error updating concept:', error);
        }
      });
    });
  }

  rejectFieldUpdate(update: any): void {
    this.clearSuggestion('update', update);
  }

  acceptSpeaker(speaker: any): void {
    this.concept$.pipe(
      takeUntil(this.destroy$),
      take(1)
    ).subscribe(concept => {
      if (!concept) return;
      
      const updatedConcept = { ...concept };
      if (!updatedConcept.speakers) updatedConcept.speakers = [];
      
      updatedConcept.speakers.push({
        id: `speaker-${Date.now()}`,
        name: speaker.name,
        bio: speaker.bio || '',
        expertise: speaker.expertise,
        suggestedTopic: speaker.suggestedTopic,
        confirmed: false
      });
      
      this.conceptService.updateConcept(concept.id, updatedConcept).subscribe({
        next: (updated: Concept) => {
          this.stateService.updateConcept(updated);
          this.clearSuggestion('speaker', speaker);
        },
        error: (error: any) => {
          console.error('Error updating concept:', error);
        }
      });
    });
  }

  rejectSpeaker(speaker: any): void {
    this.clearSuggestion('speaker', speaker);
  }

  acceptAgendaItem(agendaItem: any): void {
    this.concept$.pipe(
      takeUntil(this.destroy$),
      take(1)
    ).subscribe(concept => {
      if (!concept) return;
      
      const updatedConcept = { ...concept };
      if (!updatedConcept.agenda) updatedConcept.agenda = [];
      
      updatedConcept.agenda.push({
        id: `agenda-${Date.now()}`,
        time: agendaItem.time,
        title: agendaItem.title,
        description: agendaItem.description || '',
        type: agendaItem.type,
        speaker: agendaItem.speaker || '',
        duration: agendaItem.duration
      });
      
      this.conceptService.updateConcept(concept.id, updatedConcept).subscribe({
        next: (updated: Concept) => {
          this.stateService.updateConcept(updated);
          this.clearSuggestion('agenda', agendaItem);
        },
        error: (error: any) => {
          console.error('Error updating concept:', error);
        }
      });
    });
  }

  rejectAgendaItem(agendaItem: any): void {
    this.clearSuggestion('agenda', agendaItem);
  }

  private applyFieldUpdate(concept: any, field: string, value: any): void {
    const fieldParts = field.split('.');
    let current = concept;
    
    // Navigate to the parent object
    for (let i = 0; i < fieldParts.length - 1; i++) {
      if (!current[fieldParts[i]]) {
        current[fieldParts[i]] = {};
      }
      current = current[fieldParts[i]];
    }
    
    // Set the final value
    const finalField = fieldParts[fieldParts.length - 1];
    
    // Convert value to appropriate type
    if (finalField === 'capacity') {
      current[finalField] = parseInt(value, 10);
    } else {
      current[finalField] = value;
    }
  }

  private clearSuggestion(type: string, item: any): void {
    if (!this.currentSuggestions) return;
    
    if (type === 'update' && this.currentSuggestions.conceptUpdates) {
      this.currentSuggestions.conceptUpdates.suggestions = 
        this.currentSuggestions.conceptUpdates.suggestions.filter(s => s !== item);
    } else if (type === 'speaker' && this.currentSuggestions.conceptSuggestion?.speakers) {
      this.currentSuggestions.conceptSuggestion.speakers = 
        this.currentSuggestions.conceptSuggestion.speakers.filter(s => s !== item);
    } else if (type === 'agenda' && this.currentSuggestions.conceptSuggestion?.agenda) {
      this.currentSuggestions.conceptSuggestion.agenda = 
        this.currentSuggestions.conceptSuggestion.agenda.filter(a => a !== item);
    }
    
    // Clear all suggestions if none remain
    const hasUpdates = this.currentSuggestions.conceptUpdates?.suggestions?.length;
    const hasSpeakers = this.currentSuggestions.conceptSuggestion?.speakers?.length;
    const hasAgenda = this.currentSuggestions.conceptSuggestion?.agenda?.length;
    
    if (!hasUpdates && !hasSpeakers && !hasAgenda) {
      this.currentSuggestions = undefined;
    }
  }

  // Smart expansion logic for accordions
  shouldExpandFoundation(concept: Concept): boolean {
    // Expand if missing key foundation data OR has field suggestions
    const hasFieldSuggestions = this.currentSuggestions?.conceptUpdates?.suggestions?.some(s =>
      s.field.includes('eventDetails.') || s.field === 'title' || s.field === 'description'
    );
    
    return hasFieldSuggestions || 
           !concept.eventDetails?.theme || 
           !concept.eventDetails?.objectives?.length ||
           !concept.eventDetails?.targetAudience;
  }

  shouldExpandTimeline(concept: Concept): boolean {
    // Expand if no agenda items OR has agenda suggestions
    const hasAgendaSuggestions = !!(this.currentSuggestions?.conceptSuggestion?.agenda?.length ||
                                   this.currentSuggestions?.conceptUpdates?.suggestions?.some(s => s.field.includes('agenda')));
    
    return hasAgendaSuggestions || !concept.agenda?.length;
  }

  shouldExpandSpeakers(concept: Concept): boolean {
    // Expand if no speakers OR has speaker suggestions
    const hasSpeakerSuggestions = !!(this.currentSuggestions?.conceptSuggestion?.speakers?.length);
    
    return hasSpeakerSuggestions || !concept.speakers?.length;
  }

  shouldExpandPricing(concept: Concept): boolean {
    // Expand if no pricing set OR has pricing suggestions
    const hasPricingSuggestions = !!(this.currentSuggestions?.conceptSuggestion?.pricing);
    
    return hasPricingSuggestions || !concept.pricing?.regular;
  }

  // Check if sections are complete
  isFoundationComplete(concept: Concept): boolean {
    return !!(concept.eventDetails?.theme && 
             concept.eventDetails?.objectives?.length &&
             concept.eventDetails?.targetAudience);
  }

  isTimelineComplete(concept: Concept): boolean {
    return !!(concept.agenda?.length);
  }

  isSpeakersComplete(concept: Concept): boolean {
    return !!(concept.speakers?.length);
  }

  isPricingComplete(concept: Concept): boolean {
    return !!(concept.pricing?.regular);
  }

  // Apply AI suggestion to concept
  applySuggestion(suggestion: any): void {
    this.conceptService.applyConceptSuggestion(this.conceptId, suggestion, 'MERGE').subscribe({
      next: (updatedConcept: Concept) => {
        this.stateService.updateConcept(updatedConcept);
        // Show success feedback
        alert('Concept updated successfully!');
      },
      error: (error: any) => {
        console.error('Error applying suggestion:', error);
        alert('Failed to apply suggestion. Please try again.');
      }
    });
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'DRAFT': return 'edit';
      case 'IN_PROGRESS': return 'trending_up';
      case 'COMPLETED': return 'check_circle';
      case 'ARCHIVED': return 'archive';
      default: return 'event_note';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'DRAFT': return 'warn';
      case 'IN_PROGRESS': return 'accent';
      case 'COMPLETED': return 'primary';
      case 'ARCHIVED': return '';
      default: return '';
    }
  }

  getStatusClass(status: string): string {
    return `status-${status.toLowerCase().replace('_', '-')}`;
  }

  getStatusDisplayName(status: string): string {
    switch (status) {
      case 'DRAFT': return 'Draft';
      case 'IN_PROGRESS': return 'In Progress';
      case 'COMPLETED': return 'Completed';
      case 'ARCHIVED': return 'Archived';
      default: return status.replace('_', ' ');
    }
  }

  formatAgendaTime(time: string): string {
    return time || 'TBD';
  }

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

  formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes}min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
  }

  // Helper methods for suggestions
  getFieldSuggestion(field: string): any {
    return this.currentSuggestions?.conceptUpdates?.suggestions?.find(s => s.field === field);
  }

  getSuggestedSpeakers(): any[] {
    return this.currentSuggestions?.conceptSuggestion?.speakers || [];
  }

  getSuggestedAgendaItems(): any[] {
    return this.currentSuggestions?.conceptSuggestion?.agenda || [];
  }

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

  // Check if section has pending suggestions
  hasFoundationSuggestions(): boolean {
    return !!(this.currentSuggestions?.conceptUpdates?.suggestions?.some(s =>
      s.field.includes('eventDetails.') || s.field === 'title' || s.field === 'description'
    ));
  }

  hasTimelineSuggestions(): boolean {
    return !!(this.currentSuggestions?.conceptSuggestion?.agenda?.length ||
             this.currentSuggestions?.conceptUpdates?.suggestions?.some(s => s.field.includes('agenda')));
  }

  hasSpeakerSuggestions(): boolean {
    return !!(this.currentSuggestions?.conceptSuggestion?.speakers?.length);
  }

  hasPricingSuggestions(): boolean {
    return !!(this.currentSuggestions?.conceptSuggestion?.pricing);
  }

  // Get suggestion for editing existing agenda item
  getAgendaItemSuggestion(agendaItem: any, concept: Concept): any {
    if (!this.currentSuggestions?.conceptUpdates?.suggestions || !concept) return null;
    
    // Find the index of this agenda item in the current concept
    const itemIndex = concept.agenda.findIndex(item => item.id === agendaItem.id);
    if (itemIndex === -1) return null;
    
    // Look for suggestions specifically for this agenda item index
    return this.currentSuggestions.conceptUpdates.suggestions.find(s => 
      s.field === `agenda[${itemIndex}].duration`
    );
  }

  // Accept agenda item modification
  acceptAgendaItemEdit(agendaItem: any, update: any): void {
    this.concept$.pipe(
      takeUntil(this.destroy$),
      take(1)
    ).subscribe(concept => {
      if (!concept) return;
      
      const updatedConcept = { ...concept };
      const agendaIndex = updatedConcept.agenda.findIndex(item => item.id === agendaItem.id);
      
      if (agendaIndex !== -1) {
        // Update the specific field
        if (update.field.includes('duration')) {
          updatedConcept.agenda[agendaIndex].duration = parseInt(update.suggestedValue, 10);
        }
        // Add more field updates as needed
        
        this.conceptService.updateConcept(concept.id, updatedConcept).subscribe({
          next: (updated: Concept) => {
            this.stateService.updateConcept(updated);
            this.clearSuggestion('update', update);
          },
          error: (error: any) => {
            console.error('Error updating concept:', error);
          }
        });
      }
    });
  }
} 