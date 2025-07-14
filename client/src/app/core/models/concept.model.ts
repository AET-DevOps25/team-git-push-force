export interface Concept {
  id: string;
  title: string;
  description: string;
  status: ConceptStatus;
  eventDetails?: EventDetails;
  agenda: AgendaItem[];
  speakers: Speaker[];
  pricing?: Pricing;
  notes?: string;
  tags: string[];
  version: number;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  lastModifiedBy: string;
}

export type ConceptStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED';

export interface EventDetails {
  theme?: string;
  format: 'PHYSICAL' | 'VIRTUAL' | 'HYBRID';
  capacity?: number;
  duration?: string;
  startDate?: Date;
  endDate?: Date;
  targetAudience?: string;
  objectives: string[];
  location?: string;
}

export interface AgendaItem {
  id: string;
  time: string;
  title: string;
  description?: string;
  type: 'KEYNOTE' | 'WORKSHOP' | 'PANEL' | 'NETWORKING' | 'BREAK' | 'LUNCH';
  speaker?: string;
  duration: number;
}

export interface Speaker {
  id: string;
  name: string;
  expertise: string;
  suggestedTopic?: string;
  bio?: string;
  confirmed: boolean;
}

export interface Pricing {
  currency: string;
  earlyBird?: number;
  regular?: number;
  vip?: number;
  student?: number;
  group?: number;
}

export interface CreateConceptRequest {
  title: string;
  description: string;
  initialRequirements?: {
    targetAudience?: string;
    expectedCapacity?: number;
    preferredFormat?: 'PHYSICAL' | 'VIRTUAL' | 'HYBRID';
    startDate?: Date;
    endDate?: Date;
    budget?: string;
    duration?: string;
    theme?: string;
  };
  tags?: string[];
}

export interface UpdateConceptRequest {
  title?: string;
  description?: string;
  status?: ConceptStatus;
  eventDetails?: EventDetails;
  agenda?: AgendaItem[];
  speakers?: Speaker[];
  pricing?: Pricing;
  notes?: string;
  tags?: string[];
} 