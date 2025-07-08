import { Component, OnInit } from '@angular/core';
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
import { Observable } from 'rxjs';

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
export class ConceptDetailComponent implements OnInit {
  concept$: Observable<Concept | null>;
  conceptId: string;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private stateService: StateService
  ) {
    this.conceptId = this.route.snapshot.params['id'];
    this.concept$ = this.stateService.getCurrentConcept();
  }

  ngOnInit(): void {
    this.loadConcept();
  }

  private loadConcept(): void {
    // Get concept from state
    this.stateService.getConcepts().subscribe(concepts => {
      const concept = concepts.find(c => c.id === this.conceptId);
      if (concept) {
        this.stateService.setCurrentConcept(concept);
      } else {
        // Concept not found, redirect to concepts list
        this.router.navigate(['/concepts']);
      }
    });
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
} 