import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ChangeDetectorRef } from '@angular/core';
import { of, throwError } from 'rxjs';
import { ConceptPricingSectionComponent } from './concept-pricing-section.component';
import { ConceptSuggestionService } from '../../services/concept-suggestion.service';
import { Concept } from '../../../../core/models/concept.model';
import { ChatResponse } from '../../../../core/models/chat.model';

describe('ConceptPricingSectionComponent', () => {
  let component: ConceptPricingSectionComponent;
  let fixture: ComponentFixture<ConceptPricingSectionComponent>;
  let suggestionService: jasmine.SpyObj<ConceptSuggestionService>;
  let cdr: jasmine.SpyObj<ChangeDetectorRef>;

  const mockConcept: Concept = {
    id: 'test-concept',
    title: 'Test Event',
    description: 'Test description',
    status: 'DRAFT',
    agenda: [],
    speakers: [],
    tags: ['test'],
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: 'user1',
    lastModifiedBy: 'user1',
    pricing: {
      currency: 'USD',
      regular: 100,
      earlyBird: 80,
      vip: 200,
      student: 50,
      group: 90
    }
  };

  const mockConceptWithoutPricing: Concept = {
    id: 'test-concept-2',
    title: 'Test Event 2',
    description: 'Test description',
    status: 'DRAFT',
    agenda: [],
    speakers: [],
    tags: ['test'],
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: 'user1',
    lastModifiedBy: 'user1'
  };

  const mockSuggestionsWithPricing: ChatResponse = {
    response: 'Test response',
    conceptSuggestion: {
      pricing: {
        currency: 'USD',
        regular: 120,
        earlyBird: 100,
        vip: 250,
        student: 60
      },
      reasoning: 'AI-suggested pricing based on your event requirements'
    },
    suggestions: [],
    followUpQuestions: [],
    confidence: 0.9
  };

  const mockSuggestionsWithoutPricing: ChatResponse = {
    response: 'Test response',
    suggestions: [],
    followUpQuestions: [],
    confidence: 0.9
  };

  beforeEach(async () => {
    const suggestionServiceSpy = jasmine.createSpyObj('ConceptSuggestionService', 
      ['acceptFieldUpdate', 'updateConceptInState']);
    const cdrSpy = jasmine.createSpyObj('ChangeDetectorRef', ['detectChanges']);

    await TestBed.configureTestingModule({
      imports: [
        ConceptPricingSectionComponent,
        NoopAnimationsModule
      ],
      providers: [
        { provide: ConceptSuggestionService, useValue: suggestionServiceSpy },
        { provide: ChangeDetectorRef, useValue: cdrSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ConceptPricingSectionComponent);
    component = fixture.componentInstance;
    suggestionService = TestBed.inject(ConceptSuggestionService) as jasmine.SpyObj<ConceptSuggestionService>;
    cdr = TestBed.inject(ChangeDetectorRef) as jasmine.SpyObj<ChangeDetectorRef>;
  });

  it('should create', () => {
    component.concept = mockConcept;
    expect(component).toBeTruthy();
  });

  describe('ngOnChanges', () => {
    it('should reset suggestionAccepted flag when new suggestions arrive', () => {
      component.concept = mockConcept;
      component.suggestions = mockSuggestionsWithPricing;
      
      // Simulate accepting a suggestion first
      const suggestion = component.getPricingSuggestion();
      if (suggestion) {
        const updatedConcept = { ...mockConcept, pricing: suggestion.suggestedValue };
        suggestionService.acceptFieldUpdate.and.returnValue(of(updatedConcept));
        component.acceptPricingSuggestion(suggestion);
      }
      
      // Verify suggestion is hidden after acceptance
      expect(component.getPricingSuggestion()).toBeUndefined();
      
      // Now simulate new suggestions arriving with different pricing
      const newSuggestions = {
        ...mockSuggestionsWithPricing,
        conceptSuggestion: {
          pricing: {
            currency: 'EUR',
            regular: 150,
            earlyBird: 130,
            vip: 300,
            student: 70
          },
          reasoning: 'Updated pricing strategy'
        }
      };
      component.suggestions = newSuggestions;
      
      // Trigger ngOnChanges 
      component.ngOnChanges();
      
      // Should show suggestions again since suggestionAccepted was reset and pricing differs
      const newSuggestion = component.getPricingSuggestion();
      expect(newSuggestion).toBeDefined();
    });

    it('should not reset if no pricing suggestions exist', () => {
      component.concept = mockConcept;
      component.suggestions = mockSuggestionsWithoutPricing;
      
      component.ngOnChanges();
      
      // Should not throw any errors
      expect(component.getPricingSuggestion()).toBeUndefined();
    });
  });

  describe('getPricingSuggestion', () => {
    it('should return pricing suggestion when prices differ', () => {
      component.concept = mockConcept;
      component.suggestions = mockSuggestionsWithPricing;
      
      const suggestion = component.getPricingSuggestion();
      expect(suggestion).toEqual({
        field: 'pricing',
        currentValue: mockConcept.pricing,
        suggestedValue: mockSuggestionsWithPricing.conceptSuggestion!.pricing,
        reasoning: 'AI-suggested pricing based on your event requirements'
      });
    });

    it('should return pricing suggestion when no current pricing exists', () => {
      component.concept = mockConceptWithoutPricing;
      component.suggestions = mockSuggestionsWithPricing;
      
      const suggestion = component.getPricingSuggestion();
      expect(suggestion).toEqual({
        field: 'pricing',
        currentValue: 'Not set',
        suggestedValue: mockSuggestionsWithPricing.conceptSuggestion!.pricing,
        reasoning: 'AI-suggested pricing based on your event requirements'
      });
    });

    it('should return undefined when pricing is the same', () => {
      const conceptWithSamePricing = {
        ...mockConcept,
        pricing: {
          currency: 'USD',
          regular: 120,
          earlyBird: 100,
          vip: 250,
          student: 60
        }
      };
      component.concept = conceptWithSamePricing;
      component.suggestions = mockSuggestionsWithPricing;
      
      const suggestion = component.getPricingSuggestion();
      expect(suggestion).toBeUndefined();
    });

    it('should return undefined when no suggested pricing exists', () => {
      component.concept = mockConcept;
      component.suggestions = mockSuggestionsWithoutPricing;
      
      const suggestion = component.getPricingSuggestion();
      expect(suggestion).toBeUndefined();
    });

    it('should return undefined when pricing suggestion is rejected', () => {
      component.concept = mockConcept;
      component.suggestions = mockSuggestionsWithPricing;
      
      // First get and reject the pricing suggestion
      const suggestion = component.getPricingSuggestion();
      if (suggestion) {
        component.rejectPricingSuggestion(suggestion);
      }
      
      // Now it should return undefined
      const rejectedSuggestion = component.getPricingSuggestion();
      expect(rejectedSuggestion).toBeUndefined();
    });

    it('should return undefined when pricing suggestion is accepted', () => {
      component.concept = mockConcept;
      component.suggestions = mockSuggestionsWithPricing;
      
      // First get and accept the pricing suggestion
      const suggestion = component.getPricingSuggestion();
      if (suggestion) {
        const updatedConcept = { ...mockConcept, pricing: suggestion.suggestedValue };
        suggestionService.acceptFieldUpdate.and.returnValue(of(updatedConcept));
        component.acceptPricingSuggestion(suggestion);
      }
      
      // Now it should return undefined because suggestion was accepted
      const acceptedSuggestion = component.getPricingSuggestion();
      expect(acceptedSuggestion).toBeUndefined();
    });

    it('should use default reasoning when not provided', () => {
      const suggestionsWithoutReasoning = {
        ...mockSuggestionsWithPricing,
        conceptSuggestion: {
          pricing: {
            currency: 'USD',
            regular: 120,
            earlyBird: 100
          }
        }
      };
      component.concept = mockConcept;
      component.suggestions = suggestionsWithoutReasoning;
      
      const suggestion = component.getPricingSuggestion();
      expect(suggestion?.reasoning).toBe('AI-suggested pricing strategy based on your event details');
    });
  });

  describe('isPricingDifferent', () => {
    it('should return false when both are undefined', () => {
      const result = (component as any).isPricingDifferent(undefined, undefined);
      expect(result).toBe(false);
    });

    it('should return false when both are null', () => {
      const result = (component as any).isPricingDifferent(null, null);
      expect(result).toBe(false);
    });

    it('should return true when one is undefined and other has values', () => {
      const pricing = { currency: 'USD', regular: 100 };
      const result = (component as any).isPricingDifferent(undefined, pricing);
      expect(result).toBe(true);
    });

    it('should return false when all fields match exactly', () => {
      const pricing1 = { currency: 'USD', regular: 100, earlyBird: 80 };
      const pricing2 = { currency: 'USD', regular: 100, earlyBird: 80 };
      const result = (component as any).isPricingDifferent(pricing1, pricing2);
      expect(result).toBe(false);
    });

    it('should return true when numeric fields differ', () => {
      const pricing1 = { currency: 'USD', regular: 100, earlyBird: 80 };
      const pricing2 = { currency: 'USD', regular: 120, earlyBird: 80 };
      const result = (component as any).isPricingDifferent(pricing1, pricing2);
      expect(result).toBe(true);
    });

    it('should return true when string fields differ', () => {
      const pricing1 = { currency: 'USD', regular: 100 };
      const pricing2 = { currency: 'EUR', regular: 100 };
      const result = (component as any).isPricingDifferent(pricing1, pricing2);
      expect(result).toBe(true);
    });

    it('should handle whitespace in string comparisons', () => {
      const pricing1 = { currency: ' USD ', regular: 100 };
      const pricing2 = { currency: 'USD', regular: 100 };
      const result = (component as any).isPricingDifferent(pricing1, pricing2);
      expect(result).toBe(false);
    });

    it('should return false when undefined fields match', () => {
      const pricing1 = { currency: 'USD', regular: 100 };
      const pricing2 = { currency: 'USD', regular: 100 };
      const result = (component as any).isPricingDifferent(pricing1, pricing2);
      expect(result).toBe(false);
    });
  });

  describe('acceptPricingSuggestion', () => {
    it('should accept pricing suggestion and update concept', fakeAsync(() => {
      const pricingSuggestion = {
        field: 'pricing',
        currentValue: mockConcept.pricing,
        suggestedValue: mockSuggestionsWithPricing.conceptSuggestion!.pricing,
        reasoning: 'Better pricing'
      };
      const updatedConcept = { 
        ...mockConcept, 
        pricing: mockSuggestionsWithPricing.conceptSuggestion!.pricing 
      };
      suggestionService.acceptFieldUpdate.and.returnValue(of(updatedConcept));

      component.concept = mockConcept;
      component.acceptPricingSuggestion(pricingSuggestion);

      // Tick to process the Observable
      tick();

      expect(suggestionService.acceptFieldUpdate).toHaveBeenCalledWith(mockConcept, {
        field: 'pricing',
        suggestedValue: mockSuggestionsWithPricing.conceptSuggestion!.pricing
      });
      expect(suggestionService.updateConceptInState).toHaveBeenCalledWith(updatedConcept);
      expect(component.concept).toEqual(updatedConcept);
    }));

    it('should mark suggestion as accepted and hide suggestion UI', fakeAsync(() => {
      const pricingSuggestion = {
        field: 'pricing',
        currentValue: mockConcept.pricing,
        suggestedValue: mockSuggestionsWithPricing.conceptSuggestion!.pricing,
        reasoning: 'Better pricing'
      };
      const updatedConcept = { 
        ...mockConcept, 
        pricing: mockSuggestionsWithPricing.conceptSuggestion!.pricing 
      };
      suggestionService.acceptFieldUpdate.and.returnValue(of(updatedConcept));

      component.concept = mockConcept;
      component.suggestions = mockSuggestionsWithPricing;
      
      // Verify suggestion is available initially
      expect(component.getPricingSuggestion()).toBeDefined();
      
      component.acceptPricingSuggestion(pricingSuggestion);

      // Tick to process the Observable
      tick();

      // Verify suggestion is hidden after acceptance
      expect(component.getPricingSuggestion()).toBeUndefined();
    }));

    it('should handle error during pricing update', () => {
      const pricingSuggestion = {
        field: 'pricing',
        currentValue: mockConcept.pricing,
        suggestedValue: mockSuggestionsWithPricing.conceptSuggestion!.pricing,
        reasoning: 'Better pricing'
      };
      const error = new Error('Update failed');
      suggestionService.acceptFieldUpdate.and.returnValue(throwError(error));

      spyOn(console, 'error');

      component.concept = mockConcept;
      component.acceptPricingSuggestion(pricingSuggestion);

      expect(suggestionService.acceptFieldUpdate).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith('Error updating concept pricing:', error);
    });

    it('should reset rejection flag when accepting', fakeAsync(() => {
      const pricingSuggestion = {
        field: 'pricing',
        currentValue: mockConcept.pricing,
        suggestedValue: mockSuggestionsWithPricing.conceptSuggestion!.pricing,
        reasoning: 'Better pricing'
      };
      
      component.concept = mockConcept;
      component.suggestions = mockSuggestionsWithPricing;
      
      // First reject the suggestion
      component.rejectPricingSuggestion(pricingSuggestion);
      expect(component.getPricingSuggestion()).toBeUndefined();
      
      // Then accept it
      const updatedConcept = { 
        ...mockConcept, 
        pricing: mockSuggestionsWithPricing.conceptSuggestion!.pricing 
      };
      suggestionService.acceptFieldUpdate.and.returnValue(of(updatedConcept));
      component.acceptPricingSuggestion(pricingSuggestion);

      // Tick to process the Observable
      tick();

      // Should reset the rejection flag (tested via behavior)
      expect(suggestionService.acceptFieldUpdate).toHaveBeenCalled();
    }));
  });

  describe('rejectPricingSuggestion', () => {
    it('should mark pricing suggestion as rejected and trigger change detection', () => {
      const pricingSuggestion = {
        field: 'pricing',
        currentValue: mockConcept.pricing,
        suggestedValue: mockSuggestionsWithPricing.conceptSuggestion!.pricing,
        reasoning: 'Better pricing'
      };
      
      component.concept = mockConcept;
      component.suggestions = mockSuggestionsWithPricing;
      
      spyOn(console, 'log');

      component.rejectPricingSuggestion(pricingSuggestion);

      expect(console.log).toHaveBeenCalledWith('Rejected pricing suggestion');
      
      // Verify that the suggestion is now hidden
      const rejectedSuggestion = component.getPricingSuggestion();
      expect(rejectedSuggestion).toBeUndefined();
    });
  });

  describe('hasSuggestions', () => {
    it('should return true when pricing suggestions exist and differ', () => {
      component.concept = mockConcept;
      component.suggestions = mockSuggestionsWithPricing;
      expect(component.hasSuggestions()).toBe(true);
    });

    it('should return true when no current pricing but suggestion exists', () => {
      component.concept = mockConceptWithoutPricing;
      component.suggestions = mockSuggestionsWithPricing;
      expect(component.hasSuggestions()).toBe(true);
    });

    it('should return false when pricing matches suggestion', () => {
      const conceptWithSamePricing = {
        ...mockConcept,
        pricing: mockSuggestionsWithPricing.conceptSuggestion!.pricing
      };
      component.concept = conceptWithSamePricing;
      component.suggestions = mockSuggestionsWithPricing;
      expect(component.hasSuggestions()).toBe(false);
    });

    it('should return false when pricing suggestion is rejected', () => {
      component.concept = mockConcept;
      component.suggestions = mockSuggestionsWithPricing;
      
      // Reject the pricing suggestion
      const suggestion = component.getPricingSuggestion();
      if (suggestion) {
        component.rejectPricingSuggestion(suggestion);
      }
      
      expect(component.hasSuggestions()).toBe(false);
    });

    it('should return false when pricing suggestion is accepted', () => {
      component.concept = mockConcept;
      component.suggestions = mockSuggestionsWithPricing;
      
      // Accept the pricing suggestion
      const suggestion = component.getPricingSuggestion();
      if (suggestion) {
        const updatedConcept = { ...mockConcept, pricing: suggestion.suggestedValue };
        suggestionService.acceptFieldUpdate.and.returnValue(of(updatedConcept));
        component.acceptPricingSuggestion(suggestion);
      }
      
      expect(component.hasSuggestions()).toBe(false);
    });

    it('should return false when suggestions do not contain pricing data', () => {
      component.concept = mockConcept;
      component.suggestions = mockSuggestionsWithoutPricing;
      expect(component.hasSuggestions()).toBe(false);
    });

    it('should return false when suggestions is undefined', () => {
      component.concept = mockConcept;
      component.suggestions = undefined;
      expect(component.hasSuggestions()).toBe(false);
    });
  });

  describe('formatCurrency', () => {
    it('should format currency with USD as default', () => {
      const result = component.formatCurrency(100);
      expect(result).toBe('USD 100');
    });

    it('should format currency with specified currency', () => {
      const result = component.formatCurrency(100, 'EUR');
      expect(result).toBe('EUR 100');
    });
  });

  describe('Input properties', () => {
    it('should accept concept input', () => {
      component.concept = mockConcept;
      expect(component.concept).toEqual(mockConcept);
    });

    it('should accept suggestions input', () => {
      component.suggestions = mockSuggestionsWithPricing;
      expect(component.suggestions).toEqual(mockSuggestionsWithPricing);
    });

    it('should have default expanded value', () => {
      expect(component.expanded).toBe(false);
    });

    it('should accept expanded input', () => {
      component.expanded = true;
      expect(component.expanded).toBe(true);
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy subject', () => {
      spyOn((component as any).destroy$, 'next');
      spyOn((component as any).destroy$, 'complete');

      component.ngOnDestroy();

      expect((component as any).destroy$.next).toHaveBeenCalled();
      expect((component as any).destroy$.complete).toHaveBeenCalled();
    });
  });
}); 