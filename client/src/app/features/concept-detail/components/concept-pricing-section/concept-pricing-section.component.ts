import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Concept } from '../../../../core/models/concept.model';
import { ChatResponse } from '../../../../core/models/chat.model';

@Component({
  selector: 'app-concept-pricing-section',
  standalone: true,
  imports: [
    CommonModule,
    MatExpansionModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './concept-pricing-section.component.html',
  styleUrl: './concept-pricing-section.component.scss'
})
export class ConceptPricingSectionComponent {
  @Input() concept!: Concept;
  @Input() suggestions?: ChatResponse;
  @Input() expanded: boolean = false;

  // Check if section is complete
  isComplete(): boolean {
    return !!(this.concept.pricing?.regular);
  }

  // Check if section has suggestions
  hasSuggestions(): boolean {
    return !!(this.suggestions?.conceptSuggestion?.pricing);
  }
} 