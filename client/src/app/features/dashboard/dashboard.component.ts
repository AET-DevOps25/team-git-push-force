import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { StateService } from '../../core/services/state.service';
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
export class DashboardComponent implements OnInit {
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

  ngOnInit(): void {
    this.loadUserConcepts();
  }

  private loadUserConcepts(): void {
    const mockConcepts: Concept[] = [
      {
        id: '1',
        title: 'Tech Innovation Summit 2024',
        description: 'Annual technology innovation summit focusing on AI, blockchain, and emerging technologies. Join industry leaders for networking and knowledge sharing.',
        status: 'IN_PROGRESS',
        agenda: [],
        speakers: [],
        tags: ['technology', 'AI', 'blockchain', 'innovation'],
        version: 1,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-20'),
        userId: 'user1',
        lastModifiedBy: 'user1'
      },
      {
        id: '2',
        title: 'Healthcare Digital Transformation',
        description: 'Digital transformation in healthcare industry conference. Explore telemedicine, AI diagnostics, and patient care innovations.',
        status: 'DRAFT',
        agenda: [],
        speakers: [],
        tags: ['healthcare', 'digital', 'telemedicine', 'AI'],
        version: 1,
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-18'),
        userId: 'user1',
        lastModifiedBy: 'user1'
      },
      {
        id: '3',
        title: 'Sustainability Workshop',
        description: 'Corporate sustainability and green practices workshop. Learn about carbon footprint reduction and sustainable business practices.',
        status: 'COMPLETED',
        agenda: [],
        speakers: [],
        tags: ['sustainability', 'environment', 'green', 'corporate'],
        version: 1,
        createdAt: new Date('2024-01-05'),
        updatedAt: new Date('2024-01-16'),
        userId: 'user1',
        lastModifiedBy: 'user1'
      },
      {
        id: '4',
        title: 'Startup Pitch Competition',
        description: 'Annual startup pitch competition for emerging entrepreneurs. Showcase innovative ideas and connect with investors.',
        status: 'IN_PROGRESS',
        agenda: [],
        speakers: [],
        tags: ['startup', 'entrepreneurship', 'pitch', 'innovation'],
        version: 1,
        createdAt: new Date('2024-01-08'),
        updatedAt: new Date('2024-01-22'),
        userId: 'user1',
        lastModifiedBy: 'user1'
      },
      {
        id: '5',
        title: 'Design Thinking Masterclass',
        description: 'Intensive design thinking workshop for product managers and designers. Learn human-centered design methodologies.',
        status: 'DRAFT',
        agenda: [],
        speakers: [],
        tags: ['design', 'UX', 'product', 'workshop'],
        version: 1,
        createdAt: new Date('2024-01-12'),
        updatedAt: new Date('2024-01-19'),
        userId: 'user1',
        lastModifiedBy: 'user1'
      },
      {
        id: '6',
        title: 'AI Ethics Symposium',
        description: 'Symposium on artificial intelligence ethics and responsible AI development. Discuss bias, fairness, and transparency.',
        status: 'COMPLETED',
        agenda: [],
        speakers: [],
        tags: ['AI', 'ethics', 'responsibility', 'bias'],
        version: 1,
        createdAt: new Date('2024-01-03'),
        updatedAt: new Date('2024-01-14'),
        userId: 'user1',
        lastModifiedBy: 'user1'
      }
    ];

    this.stateService.setConcepts(mockConcepts);
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

  shareConcept(event: Event, conceptId: string): void {
    event.stopPropagation();
    // TODO: Implement sharing functionality
    console.log('Share concept:', conceptId);
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

  getProgressPercentage(): number {
    // Calculate progress percentage based on completed vs total concepts
    let totalConcepts = 0;
    let completedConcepts = 0;
    
    this.conceptsCount$.subscribe(count => totalConcepts = count);
    this.completedCount$.subscribe(count => completedConcepts = count);
    
    return totalConcepts > 0 ? Math.round((completedConcepts / totalConcepts) * 100) : 0;
  }

  trackByConcept(index: number, concept: Concept): string {
    return concept.id;
  }
} 