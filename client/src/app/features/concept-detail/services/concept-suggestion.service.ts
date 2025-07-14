import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ConceptService } from '../../../core/services/concept.service';
import { StateService } from '../../../core/services/state.service';
import { Concept } from '../../../core/models/concept.model';

@Injectable({
  providedIn: 'root'
})
export class ConceptSuggestionService {
  constructor(
    private conceptService: ConceptService,
    private stateService: StateService
  ) {}

  // Accept field update suggestion
  acceptFieldUpdate(concept: Concept, update: any): Observable<Concept> {
    const updatedConcept = { ...concept };
    this.applyFieldUpdate(updatedConcept, update.field, update.suggestedValue);
    
    return this.conceptService.updateConcept(concept.id, updatedConcept);
  }

  // Accept speaker suggestion
  acceptSpeaker(concept: Concept, speaker: any): Observable<Concept> {
    const updatedConcept = { ...concept };
    if (!updatedConcept.speakers) updatedConcept.speakers = [];
    
    updatedConcept.speakers.push({
      id: `speaker-${Date.now()}`,
      name: speaker.name,
      bio: speaker.bio || '',
      expertise: speaker.expertise,
      suggestedTopic: speaker.suggestedTopic,
      confirmed: false
    });
    
    return this.conceptService.updateConcept(concept.id, updatedConcept);
  }

  // Accept agenda item suggestion
  acceptAgendaItem(concept: Concept, agendaItem: any): Observable<Concept> {
    const updatedConcept = { ...concept };
    if (!updatedConcept.agenda) updatedConcept.agenda = [];
    
    updatedConcept.agenda.push({
      id: `agenda-${Date.now()}`,
      time: agendaItem.time,
      title: agendaItem.title,
      description: agendaItem.description || '',
      type: agendaItem.type,
      speaker: agendaItem.speaker || '',
      duration: agendaItem.duration
    });
    
    return this.conceptService.updateConcept(concept.id, updatedConcept);
  }

  // Accept agenda item edit
  acceptAgendaItemEdit(concept: Concept, agendaItem: any, update: any): Observable<Concept> {
    const updatedConcept = { ...concept };
    const agendaIndex = updatedConcept.agenda.findIndex(item => item.id === agendaItem.id);
    
    if (agendaIndex !== -1) {
      if (update.field.includes('duration')) {
        updatedConcept.agenda[agendaIndex].duration = parseInt(update.suggestedValue, 10);
      }
      // Add more field updates as needed
    }
    
    return this.conceptService.updateConcept(concept.id, updatedConcept);
  }

  // Update concept in state after successful operation
  updateConceptInState(updatedConcept: Concept): void {
    this.stateService.updateConcept(updatedConcept);
  }

  // Apply field update to concept object
  private applyFieldUpdate(concept: any, field: string, value: any): void {
    const fieldParts = field.split('.');
    let current = concept;
    
    // Navigate to the parent object
    for (let i = 0; i < fieldParts.length - 1; i++) {
      if (!current[fieldParts[i]]) {
        current[fieldParts[i]] = {};
      }
      current = current[fieldParts[i]];
    }
    
    // Set the final value
    const finalField = fieldParts[fieldParts.length - 1];
    
    // Convert value to appropriate type
    if (finalField === 'capacity') {
      current[finalField] = parseInt(value, 10);
    } else {
      current[finalField] = value;
    }
  }
} 