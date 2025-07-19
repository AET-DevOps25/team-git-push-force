import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
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
import { ChatService } from '../../core/services/chat.service';
import { Concept } from '../../core/models/concept.model';
import { ChatResponse } from '../../core/models/chat.model';
import { ChatInterfaceComponent } from '../../shared/components/common/chat-interface/chat-interface.component';
import { ConceptFoundationSectionComponent } from './components/concept-foundation-section/concept-foundation-section.component';
import { ConceptTimelineSectionComponent } from './components/concept-timeline-section/concept-timeline-section.component';
import { ConceptSpeakersSectionComponent } from './components/concept-speakers-section/concept-speakers-section.component';
import { ConceptPricingSectionComponent } from './components/concept-pricing-section/concept-pricing-section.component';
import { Observable, Subject, timer } from 'rxjs';
import { takeUntil, take } from 'rxjs/operators';

@Component({
  selector: 'app-concept-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatChipsModule,
    MatExpansionModule,
    MatDividerModule,
    ChatInterfaceComponent,
    ConceptFoundationSectionComponent,
    ConceptTimelineSectionComponent,
    ConceptSpeakersSectionComponent,
    ConceptPricingSectionComponent
  ],
  templateUrl: './concept-detail.component.html',
  styleUrl: './concept-detail.component.scss'
})
export class ConceptDetailComponent implements OnInit, OnDestroy {
  concept: Concept | null = null;
  conceptId: string;
  currentSuggestions?: ChatResponse;
  isLoading = true;
  
  // Expansion states
  expandFoundation = false;
  expandTimeline = false;
  expandSpeakers = false;
  expandPricing = false;
  
  private destroy$ = new Subject<void>();
  private chatInitialized = new Set<string>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private stateService: StateService,
    private conceptService: ConceptService,
    private chatService: ChatService,
    private cdr: ChangeDetectorRef
  ) {
    this.conceptId = this.route.snapshot.params['id'];
  }

  ngOnInit(): void {
    // Timeout to prevent infinite loading
    timer(15000).pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      if (this.isLoading) {
        this.isLoading = false;
        this.router.navigate(['/concepts']);
        this.cdr.markForCheck();
      }
    });

    // Load and find the concept
    this.stateService.getConcepts().pipe(
      takeUntil(this.destroy$)
    ).subscribe(concepts => {
      if (concepts.length > 0) {
        const foundConcept = concepts.find(c => c.id === this.conceptId);
        
        if (foundConcept) {
          this.concept = foundConcept;
          this.isLoading = false;
          // Don't call setCurrentConcept here as it causes infinite loop
          this.updateExpansionStates(foundConcept);
          this.initializeChatIfNeeded(foundConcept);
        } else if (this.stateService.areConceptsLoaded()) {
          this.isLoading = false;
          this.router.navigate(['/concepts']);
        }
      } else if (this.stateService.areConceptsLoaded()) {
        this.isLoading = false;
        this.router.navigate(['/concepts']);
      }
      
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeChatIfNeeded(concept: Concept): void {
    if (!this.chatInitialized.has(concept.id)) {
      this.chatInitialized.add(concept.id);
      
      this.stateService.getUser().pipe(
        take(1)
      ).subscribe(user => {
        if (user) {
          // Set loading state before initializing
          this.stateService.setLoading('chat', true);
          
          this.chatService.initializeChat(
            concept.id,
            user.id,
            concept.title,
            user.preferences
          ).subscribe({
            next: () => {
              this.stateService.setLoading('chat', false);
            },
            error: (error) => {
              console.error('Failed to initialize chat:', error);
              this.stateService.setLoading('chat', false);
            }
          });
        }
      });
    }
  }

  private updateExpansionStates(concept: Concept): void {
    this.expandFoundation = this.shouldExpandFoundation(concept);
    this.expandTimeline = this.shouldExpandTimeline(concept);
    this.expandSpeakers = this.shouldExpandSpeakers(concept);
    this.expandPricing = this.shouldExpandPricing(concept);
  }

  onSuggestionsReceived(suggestions: ChatResponse): void {
    this.currentSuggestions = suggestions;
    
    if (this.concept) {
      this.updateExpansionStates(this.concept);
      this.cdr.markForCheck();
    }
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

  // Status helper methods
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
} 