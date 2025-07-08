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
    
    this.recentConcepts$ = this.concepts$.pipe(
      map(concepts => concepts
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 3)
      )
    );
  }

  ngOnInit(): void {
    // Load user concepts on component init
    this.loadUserConcepts();
  }

  private loadUserConcepts(): void {
    // For MVP, we'll load mock data or use existing concepts from state
    // In real implementation, this would call an API
    const mockConcepts: Concept[] = [
      {
        id: '1',
        title: 'Tech Innovation Summit 2024',
        description: 'Annual technology innovation summit focusing on AI and blockchain',
        status: 'IN_PROGRESS',
        agenda: [],
        speakers: [],
        tags: ['technology', 'AI'],
        version: 1,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-20'),
        userId: 'user1',
        lastModifiedBy: 'user1'
      },
      {
        id: '2',
        title: 'Healthcare Digital Transform',
        description: 'Digital transformation in healthcare industry conference',
        status: 'DRAFT',
        agenda: [],
        speakers: [],
        tags: ['healthcare', 'digital'],
        version: 1,
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-18'),
        userId: 'user1',
        lastModifiedBy: 'user1'
      },
      {
        id: '3',
        title: 'Sustainability Workshop',
        description: 'Corporate sustainability and green practices workshop',
        status: 'COMPLETED',
        agenda: [],
        speakers: [],
        tags: ['sustainability', 'environment'],
        version: 1,
        createdAt: new Date('2024-01-05'),
        updatedAt: new Date('2024-01-16'),
        userId: 'user1',
        lastModifiedBy: 'user1'
      }
    ];

    this.stateService.setConcepts(mockConcepts);
  }

  createConcept(): void {
    this.router.navigate(['/concepts/create']);
  }

  viewAllConcepts(): void {
    this.router.navigate(['/concepts']);
  }

  viewConcept(conceptId: string): void {
    this.router.navigate(['/concepts', conceptId]);
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
} 