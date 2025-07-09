import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { StateService } from '../../core/services/state.service';
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
    private stateService: StateService
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
    // For MVP, show placeholder
    alert('PDF export functionality will be implemented in a future version');
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
} 