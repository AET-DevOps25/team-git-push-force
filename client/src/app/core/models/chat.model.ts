import { Concept } from './concept.model';
import { UserPreferences } from './user.model';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  conversationId?: string;
}

export interface ChatRequest {
  message: string;
  concept: Concept;
  conversationId?: string;
  userPreferences?: UserPreferences;
  context?: {
    previousMessages: ChatMessage[];
    includeDocuments: boolean;
    maxTokens: number;
  };
}

export interface ChatResponse {
  response: string;
  suggestions: string[];
  followUpQuestions: string[];
  conceptSuggestion?: ConceptSuggestion;
  conceptUpdates?: ConceptUpdates;
  sources?: Source[];
  confidence: number;
  tokens?: {
    prompt: number;
    response: number;
    total: number;
  };
}

export interface ConceptSuggestion {
  title?: string;
  description?: string;
  eventDetails?: {
    theme?: string;
    format?: 'PHYSICAL' | 'VIRTUAL' | 'HYBRID';
    capacity?: number;
    duration?: string;
    startDate?: Date;
    endDate?: Date;
    targetAudience?: string;
    objectives?: string[];
    location?: string;
  };
  agenda?: {
    time: string;
    title: string;
    description?: string;
    type: 'KEYNOTE' | 'WORKSHOP' | 'PANEL' | 'NETWORKING' | 'BREAK' | 'LUNCH';
    speaker?: string;
    duration: number;
  }[];
  speakers?: {
    name: string;
    expertise: string;
    suggestedTopic?: string;
    bio?: string;
  }[];
  pricing?: {
    currency: string;
    earlyBird?: number;
    regular?: number;
    vip?: number;
    student?: number;
    group?: number;
  };
  notes?: string;
  reasoning?: string;
  confidence?: number;
}

export interface ConceptUpdates {
  suggestions: {
    field: string;
    currentValue: string;
    suggestedValue: string;
    reasoning: string;
  }[];
}

export interface Source {
  documentId: string;
  filename: string;
  pageNumber?: number;
  section?: string;
  confidence: number;
} 