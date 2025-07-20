import { Component, Input, OnDestroy, OnChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Concept } from '../../../../core/models/concept.model';
import { ChatResponse } from '../../../../core/models/chat.model';
import { ConceptSuggestionService } from '../../services/concept-suggestion.service';

interface PricingSuggestion {
  field: string;
  currentValue: any;
  suggestedValue: any;
  reasoning: string;
}

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
export class ConceptPricingSectionComponent implements OnDestroy, OnChanges {
  @Input() concept!: Concept;
  @Input() suggestions?: ChatResponse;
  @Input() expanded: boolean = false;

  private destroy$ = new Subject<void>();
  private pricingSuggestionRejected = false;
  private suggestionAccepted = false;

  constructor(
    private suggestionService: ConceptSuggestionService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Reset suggestion state when new suggestions come in
  ngOnChanges(): void {
    // Reset suggestion state when new suggestions arrive
    if (this.suggestions?.conceptSuggestion?.pricing) {
      this.suggestionAccepted = false;
    }
  }

  // Get pricing suggestion by comparing current vs suggested values
  getPricingSuggestion(): PricingSuggestion | undefined {
    if (!this.suggestions?.conceptSuggestion?.pricing || 
        this.pricingSuggestionRejected || 
        this.suggestionAccepted) {
      return undefined;
    }

    const suggestedPricing = this.suggestions.conceptSuggestion.pricing;
    const currentPricing = this.concept.pricing;

    // Check if there are any differences
    if (!currentPricing || this.isPricingDifferent(currentPricing, suggestedPricing)) {
      return {
        field: 'pricing',
        currentValue: currentPricing || 'Not set',
        suggestedValue: suggestedPricing,
        reasoning: this.suggestions.conceptSuggestion.reasoning || 'AI-suggested pricing strategy based on your event details'
      };
    }

    return undefined;
  }

  // Check if pricing values are different - more robust comparison
  private isPricingDifferent(current: any, suggested: any): boolean {
    if (!current && !suggested) return false;
    if (!current || !suggested) return true;

    const fields = ['currency', 'regular', 'earlyBird', 'vip', 'student', 'group'];
    
    return fields.some(field => {
      const currentValue = current[field];
      const suggestedValue = suggested[field];
      
      // Handle undefined/null comparisons
      if (currentValue === undefined && suggestedValue === undefined) return false;
      if (currentValue === null && suggestedValue === null) return false;
      if ((currentValue === undefined || currentValue === null) && 
          (suggestedValue === undefined || suggestedValue === null)) return false;
      
      // For numeric values, ensure they're properly compared
      if (typeof currentValue === 'number' && typeof suggestedValue === 'number') {
        return currentValue !== suggestedValue;
      }
      
      // For string values
      if (typeof currentValue === 'string' && typeof suggestedValue === 'string') {
        return currentValue.trim() !== suggestedValue.trim();
      }
      
      // Fallback to strict equality
      return currentValue !== suggestedValue;
    });
  }

  // Accept pricing suggestion
  acceptPricingSuggestion(suggestion: PricingSuggestion): void {
    const update = { 
      field: suggestion.field, 
      suggestedValue: suggestion.suggestedValue 
    };

    this.suggestionService.acceptFieldUpdate(this.concept, update)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedConcept: Concept) => {
          this.suggestionService.updateConceptInState(updatedConcept);
          // Update the concept input to reflect the change
          this.concept = updatedConcept;
          // Mark suggestion as accepted to hide suggestion UI
          this.suggestionAccepted = true;
          // Reset rejection flag
          this.pricingSuggestionRejected = false;
          // Trigger change detection to update the UI
          this.cdr.detectChanges();
        },
        error: (error: any) => {
          console.error('Error updating concept pricing:', error);
        }
      });
  }

  // Reject pricing suggestion
  rejectPricingSuggestion(suggestion: PricingSuggestion): void {
    // Mark pricing suggestion as rejected to hide it
    this.pricingSuggestionRejected = true;
    this.suggestionAccepted = false;
    console.log('Rejected pricing suggestion');
    // Trigger change detection to update the UI
    this.cdr.detectChanges();
  }

  // Check if section has suggestions
  hasSuggestions(): boolean {
    return !!this.getPricingSuggestion();
  }

  // Format currency value for display
  formatCurrency(amount: number, currency: string = 'USD'): string {
    return `${currency} ${amount}`;
  }
} 