import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { StateService } from '../../core/services';
import { User } from '../../core/models/user.model';
import { Concept } from '../../core/models/concept.model';
import { Observable, map } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatGridListModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  user$: Observable<User | null>;
  concepts$: Observable<Concept[]>;
  conceptsCount$: Observable<number>;
  inProgressCount$: Observable<number>;
  completedCount$: Observable<number>;
  recentConcepts$: Observable<Concept[]>;

  constructor(
    private stateService: StateService,
    private router: Router
  ) {
    this.user$ = this.stateService.getUser();
    this.concepts$ = this.stateService.getConcepts();
    
    this.conceptsCount$ = this.concepts$.pipe(
      map(concepts => concepts.length)
    );
    
    this.inProgressCount$ = this.concepts$.pipe(
      map(concepts => concepts.filter(c => c.status === 'IN_PROGRESS').length)
    );
    
    this.completedCount$ = this.concepts$.pipe(
      map(concepts => concepts.filter(c => c.status === 'COMPLETED').length)
    );
    
    this.recentConcepts$ = this.concepts$.pipe(
      map(concepts => concepts
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 6) // Show more recent concepts
      )
    );
  }

  // Navigation methods
  createConcept(): void {
    this.router.navigate(['/concepts/create']);
  }

  viewAllConcepts(): void {
    this.router.navigate(['/concepts']);
  }

  viewConcept(conceptId: string): void {
    this.router.navigate(['/concepts', conceptId]);
  }

  // Action methods
  editConcept(event: Event, conceptId: string): void {
    event.stopPropagation();
    this.router.navigate(['/concepts', conceptId, 'edit']);
  }

  // Helper methods
  getStatusIcon(status: string): string {
    switch (status) {
      case 'DRAFT': return 'edit_note';
      case 'IN_PROGRESS': return 'hourglass_top';
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

  getStatusDisplayName(status: string): string {
    switch (status) {
      case 'IN_PROGRESS': return 'In Progress';
      case 'COMPLETED': return 'Completed';
      case 'DRAFT': return 'Draft';
      case 'ARCHIVED': return 'Archived';
      default: return status;
    }
  }

  trackByConcept(index: number, concept: Concept): string {
    return concept.id;
  }
} 