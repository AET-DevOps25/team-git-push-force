import { Routes } from '@angular/router';

export const conceptsRoutes: Routes = [
  { 
    path: '', 
    loadComponent: () => import('./components/concepts-list/concepts-list.component').then(m => m.ConceptsListComponent)
  },
  { 
    path: 'create', 
    loadComponent: () => import('./components/create-concept/create-concept.component').then(m => m.CreateConceptComponent)
  },
  { 
    path: ':id', 
    loadComponent: () => import('../concept-detail/concept-detail.component').then(m => m.ConceptDetailComponent)
  }
]; 