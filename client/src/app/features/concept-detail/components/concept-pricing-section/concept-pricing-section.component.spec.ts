import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ConceptPricingSectionComponent } from './concept-pricing-section.component';
import { Concept } from '../../../../core/models/concept.model';
import { ChatResponse } from '../../../../core/models/chat.model';

describe('ConceptPricingSectionComponent', () => {
  let component: ConceptPricingSectionComponent;
  let fixture: ComponentFixture<ConceptPricingSectionComponent>;

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
        vip: 250
      }
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
    await TestBed.configureTestingModule({
      imports: [
        ConceptPricingSectionComponent,
        NoopAnimationsModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ConceptPricingSectionComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    component.concept = mockConcept;
    expect(component).toBeTruthy();
  });

  describe('isComplete', () => {
    it('should return true when concept has regular pricing', () => {
      component.concept = mockConcept;
      expect(component.isComplete()).toBe(true);
    });

    it('should return false when concept has no pricing', () => {
      component.concept = mockConceptWithoutPricing;
      expect(component.isComplete()).toBe(false);
    });

    it('should return false when concept pricing exists but no regular price', () => {
      const conceptWithPricingButNoRegular = {
        ...mockConcept,
        pricing: {
          currency: 'USD',
          earlyBird: 80,
          vip: 200
        }
      };
      component.concept = conceptWithPricingButNoRegular;
      expect(component.isComplete()).toBe(false);
    });
  });

  describe('hasSuggestions', () => {
    it('should return true when suggestions contain pricing data', () => {
      component.suggestions = mockSuggestionsWithPricing;
      expect(component.hasSuggestions()).toBe(true);
    });

    it('should return false when suggestions do not contain pricing data', () => {
      component.suggestions = mockSuggestionsWithoutPricing;
      expect(component.hasSuggestions()).toBe(false);
    });

    it('should return false when suggestions is undefined', () => {
      component.suggestions = undefined;
      expect(component.hasSuggestions()).toBe(false);
    });

    it('should return false when conceptSuggestion is undefined', () => {
      component.suggestions = {
        response: 'Test response',
        suggestions: [],
        followUpQuestions: [],
        confidence: 0.9
      };
      expect(component.hasSuggestions()).toBe(false);
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
}); 