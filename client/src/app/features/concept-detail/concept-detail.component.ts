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
import { ChatInterfaceComponent } from '../../shared/components/common/chat-interface/chat-interface.component';
import { Observable, Subject, combineLatest } from 'rxjs';
import { map, takeUntil, filter } from 'rxjs/operators';

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

  // Smart expansion logic for accordions
  shouldExpandFoundation(concept: Concept): boolean {
    // Expand if missing key foundation data
    return !concept.eventDetails?.theme || 
           !concept.eventDetails?.objectives?.length ||
           !concept.eventDetails?.targetAudience;
  }

  shouldExpandTimeline(concept: Concept): boolean {
    // Expand if no agenda items
    return !concept.agenda?.length;
  }

  shouldExpandSpeakers(concept: Concept): boolean {
    // Expand if no speakers
    return !concept.speakers?.length;
  }

  shouldExpandPricing(concept: Concept): boolean {
    // Expand if no pricing set
    return !concept.pricing?.regular;
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
} 