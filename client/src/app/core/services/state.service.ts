import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ChatMessage, Concept, User } from '../models';
import { ConceptService } from './concept.service';

export interface LoadingState {
  [key: string]: boolean;
}

export interface AppState {
  user: User | null;
  concepts: Concept[];
  conceptsLoaded: boolean;
  currentConcept: Concept | null;
  chatMessages: ChatMessage[];
  loading: LoadingState;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class StateService {
  private readonly initialState: AppState = {
    user: null,
    concepts: [],
    conceptsLoaded: false,
    currentConcept: null,
    chatMessages: [],
    loading: {},
    error: null
  };

  private state$ = new BehaviorSubject<AppState>(this.initialState);

  constructor(private conceptService: ConceptService) {}

  // Selectors
  getState(): Observable<AppState> {
    return this.state$.asObservable();
  }

  getUser(): Observable<User | null> {
    return this.state$.pipe(map(state => state.user));
  }

  getConcepts(): Observable<Concept[]> {
    // Automatically load concepts if not cached
    this.loadConceptsIfNeeded();
    return this.state$.pipe(map(state => state.concepts));
  }

  areConceptsLoaded(): boolean {
    return this.state$.value.conceptsLoaded;
  }

  getCurrentConcept(): Observable<Concept | null> {
    return this.state$.pipe(map(state => state.currentConcept));
  }

  getChatMessages(): Observable<ChatMessage[]> {
    return this.state$.pipe(map(state => state.chatMessages));
  }

  isLoading(key: string): Observable<boolean> {
    return this.state$.pipe(map(state => state.loading[key] || false));
  }

  getError(): Observable<string | null> {
    return this.state$.pipe(map(state => state.error));
  }

  // Private method to handle concept loading with caching
  private loadConceptsIfNeeded(): void {
    if (!this.areConceptsLoaded() && !this.state$.value.loading['concepts']) {
      this.setLoading('concepts', true);
      this.conceptService.getConcepts().subscribe({
        next: (response: {content: Concept[], totalElements: number, totalPages: number}) => {
          this.setConcepts(response.content);
          this.setLoading('concepts', false);
          console.log(`Loaded ${response.content.length} concepts (${response.totalElements} total)`);
        },
        error: (error: any) => {
          this.setLoading('concepts', false);
          console.error('Error loading concepts:', error);
          this.setError('Failed to load concepts');
        }
      });
    }
  }

  // Actions
  setUser(user: User | null): void {
    this.updateState({ user });
  }

  setConcepts(concepts: Concept[]): void {
    this.updateState({ concepts, conceptsLoaded: true });
  }

  addConcept(concept: Concept): void {
    const concepts = [...this.state$.value.concepts, concept];
    this.updateState({ concepts });
  }

  updateConcept(updatedConcept: Concept): void {
    const concepts = this.state$.value.concepts.map(concept => 
      concept.id === updatedConcept.id ? updatedConcept : concept
    );
    this.updateState({ concepts });
    
    if (this.state$.value.currentConcept?.id === updatedConcept.id) {
      this.updateState({ currentConcept: updatedConcept });
    }
  }

  removeConcept(conceptId: string): void {
    const concepts = this.state$.value.concepts.filter(concept => concept.id !== conceptId);
    this.updateState({ concepts });
    
    if (this.state$.value.currentConcept?.id === conceptId) {
      this.updateState({ currentConcept: null });
    }
  }

  setCurrentConcept(concept: Concept | null): void {
    this.updateState({ currentConcept: concept });
  }

  addChatMessage(message: ChatMessage): void {
    const chatMessages = [...this.state$.value.chatMessages, message];
    this.updateState({ chatMessages });
  }

  setChatMessages(messages: ChatMessage[]): void {
    this.updateState({ chatMessages: messages });
  }

  setLoading(key: string, isLoading: boolean): void {
    const loading = { ...this.state$.value.loading, [key]: isLoading };
    this.updateState({ loading });
  }

  setError(error: string | null): void {
    this.updateState({ error });
  }

  reset(): void {
    this.state$.next(this.initialState);
  }

  // Method to force refresh concepts
  refreshConcepts(): void {
    this.updateState({ conceptsLoaded: false });
    this.loadConceptsIfNeeded();
  }

  private updateState(partialState: Partial<AppState>): void {
    this.state$.next({ ...this.state$.value, ...partialState });
  }
} 