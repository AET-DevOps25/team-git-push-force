import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ConceptService } from '../../../core/services/concept.service';
import { StateService } from '../../../core/services/state.service';
import { Concept, UpdateConceptRequest } from '../../../core/models/concept.model';

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
    
    return this.conceptService.updateConcept(concept.id, this.extractUpdateRequest(updatedConcept));
  }

  // Accept speaker suggestion
  acceptSpeaker(concept: Concept, speaker: any): Observable<Concept> {
    const updatedConcept = { ...concept };
    if (!updatedConcept.speakers) updatedConcept.speakers = [];
    
    updatedConcept.speakers.push({
      // No ID field - let backend generate it
      name: speaker.name,
      bio: speaker.bio || '',
      expertise: speaker.expertise,
      suggestedTopic: speaker.suggestedTopic,
      confirmed: false
    });
    
    return this.conceptService.updateConcept(concept.id, this.extractUpdateRequest(updatedConcept));
  }

  // Accept agenda item suggestion
  acceptAgendaItem(concept: Concept, agendaItem: any): Observable<Concept> {
    const updatedConcept = { ...concept };
    if (!updatedConcept.agenda) updatedConcept.agenda = [];
    
    updatedConcept.agenda.push({
      // No ID field - let backend generate it
      time: agendaItem.time,
      title: agendaItem.title,
      description: agendaItem.description || '',
      type: agendaItem.type,
      speaker: agendaItem.speaker || '',
      duration: agendaItem.duration
    });
    
    return this.conceptService.updateConcept(concept.id, this.extractUpdateRequest(updatedConcept));
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
    
    return this.conceptService.updateConcept(concept.id, this.extractUpdateRequest(updatedConcept));
  }

  // Update concept in state after successful operation
  updateConceptInState(updatedConcept: Concept): void {
    this.stateService.updateConcept(updatedConcept);
  }

  // Extract only the updatable fields from a Concept object to create an UpdateConceptRequest
  private extractUpdateRequest(concept: Concept): UpdateConceptRequest {
    const updateRequest: UpdateConceptRequest = {};

    // Only include fields that have valid values
    if (concept.title && concept.title.trim()) {
      updateRequest.title = concept.title;
    }
    
    if (concept.description && concept.description.trim()) {
      updateRequest.description = concept.description;
    }
    
    if (concept.status) {
      updateRequest.status = concept.status;
    }

    // Handle eventDetails - only include if it has valid properties
    if (concept.eventDetails) {
      const eventDetails: any = {};
      let hasValidEventDetails = false;

      if (concept.eventDetails.theme && concept.eventDetails.theme.trim()) {
        eventDetails.theme = concept.eventDetails.theme;
        hasValidEventDetails = true;
      }

      if (concept.eventDetails.format) {
        eventDetails.format = concept.eventDetails.format;
        hasValidEventDetails = true;
      }

      if (concept.eventDetails.capacity !== null && concept.eventDetails.capacity !== undefined) {
        eventDetails.capacity = concept.eventDetails.capacity;
        hasValidEventDetails = true;
      }

      if (concept.eventDetails.duration && concept.eventDetails.duration.trim()) {
        eventDetails.duration = concept.eventDetails.duration;
        hasValidEventDetails = true;
      }

      if (concept.eventDetails.startDate) {
        eventDetails.startDate = concept.eventDetails.startDate;
        hasValidEventDetails = true;
      }

      if (concept.eventDetails.endDate) {
        eventDetails.endDate = concept.eventDetails.endDate;
        hasValidEventDetails = true;
      }

      if (concept.eventDetails.targetAudience && concept.eventDetails.targetAudience.trim()) {
        eventDetails.targetAudience = concept.eventDetails.targetAudience;
        hasValidEventDetails = true;
      }

      if (concept.eventDetails.objectives && concept.eventDetails.objectives.length > 0) {
        eventDetails.objectives = concept.eventDetails.objectives;
        hasValidEventDetails = true;
      }

      if (concept.eventDetails.location && concept.eventDetails.location.trim()) {
        eventDetails.location = concept.eventDetails.location;
        hasValidEventDetails = true;
      }

      if (hasValidEventDetails) {
        updateRequest.eventDetails = eventDetails;
      }
    }

    // Handle agenda - only include if array has items (keep existing IDs unchanged)
    if (concept.agenda && concept.agenda.length > 0) {
      updateRequest.agenda = concept.agenda;
    }

    // Handle speakers - only include if array has items (keep existing IDs unchanged)
    if (concept.speakers && concept.speakers.length > 0) {
      updateRequest.speakers = concept.speakers;
    }

    // Handle pricing - only include if it has valid properties
    if (concept.pricing && (
      concept.pricing.earlyBird !== null || 
      concept.pricing.regular !== null || 
      concept.pricing.vip !== null || 
      concept.pricing.student !== null || 
      concept.pricing.group !== null
    )) {
      updateRequest.pricing = concept.pricing;
    }

    // Handle notes - only include if not empty
    if (concept.notes && concept.notes.trim()) {
      updateRequest.notes = concept.notes;
    }

    // Handle tags - only include if array has items
    if (concept.tags && concept.tags.length > 0) {
      updateRequest.tags = concept.tags;
    }

    return updateRequest;
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