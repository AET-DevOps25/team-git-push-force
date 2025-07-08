import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { FormsModule } from '@angular/forms';
import { StateService } from '../../../../core/services/state.service';
import { Concept, ConceptStatus } from '../../../../core/models/concept.model';
import { Observable, map, combineLatest } from 'rxjs';

@Component({
  selector: 'app-concepts-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule
  ],
  templateUrl: './concepts-list.component.html',
  styleUrl: './concepts-list.component.scss'
})
export class ConceptsListComponent implements OnInit {
  concepts$: Observable<Concept[]>;
  filteredConcepts$: Observable<Concept[]>;
  
  searchQuery = '';
  statusFilter: ConceptStatus | 'ALL' = 'ALL';
  
  displayedColumns: string[] = ['title', 'status', 'updatedAt', 'tags', 'actions'];
  
  statusOptions = [
    { value: 'ALL', label: 'All Status' },
    { value: 'DRAFT', label: 'Draft' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'ARCHIVED', label: 'Archived' }
  ];

  constructor(
    private stateService: StateService,
    private router: Router
  ) {
    this.concepts$ = this.stateService.getConcepts();
    this.filteredConcepts$ = this.concepts$;
  }

  ngOnInit(): void {
    this.updateFilteredConcepts();
  }

  private updateFilteredConcepts(): void {
    this.filteredConcepts$ = this.concepts$.pipe(
      map(concepts => {
        let filtered = concepts;
        
        // Apply search filter
        if (this.searchQuery.trim()) {
          const query = this.searchQuery.toLowerCase();
          filtered = filtered.filter(concept => 
            concept.title.toLowerCase().includes(query) ||
            concept.description.toLowerCase().includes(query) ||
            concept.tags.some(tag => tag.toLowerCase().includes(query))
          );
        }
        
        // Apply status filter
        if (this.statusFilter !== 'ALL') {
          filtered = filtered.filter(concept => concept.status === this.statusFilter);
        }
        
        // Sort by most recent first
        return filtered.sort((a, b) => 
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      })
    );
  }

  onSearchChange(): void {
    this.updateFilteredConcepts();
  }

  onStatusFilterChange(): void {
    this.updateFilteredConcepts();
  }

  createConcept(): void {
    this.router.navigate(['/concepts/create']);
  }

  viewConcept(conceptId: string): void {
    this.router.navigate(['/concepts', conceptId]);
  }

  editConcept(conceptId: string): void {
    this.router.navigate(['/concepts', conceptId, 'edit']);
  }

  getStatusIcon(status: ConceptStatus): string {
    switch (status) {
      case 'DRAFT': return 'edit';
      case 'IN_PROGRESS': return 'trending_up';
      case 'COMPLETED': return 'check_circle';
      case 'ARCHIVED': return 'archive';
      default: return 'event_note';
    }
  }

  getStatusColor(status: ConceptStatus): string {
    switch (status) {
      case 'DRAFT': return 'warn';
      case 'IN_PROGRESS': return 'accent';
      case 'COMPLETED': return 'primary';
      case 'ARCHIVED': return '';
      default: return '';
    }
  }

  getStatusClass(status: ConceptStatus): string {
    return `status-${status.toLowerCase().replace('_', '-')}`;
  }
} 