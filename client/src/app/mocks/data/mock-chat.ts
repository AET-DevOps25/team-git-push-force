import { ChatMessage, ChatResponse, ConceptSuggestion, ConceptUpdates, Source } from '../../core/models/chat.model';

export const MOCK_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    role: 'user',
    content: 'I want to create a tech conference focused on AI. It should be for about 300 people and include both technical and business tracks.',
    timestamp: new Date('2024-01-15T10:30:00Z'),
    conversationId: 'conv-1'
  },
  {
    id: 'msg-2',
    role: 'assistant',
    content: 'Excellent idea! An AI-focused conference with both technical and business tracks is very timely. Based on your requirements, I suggest a 2-3 day hybrid event. Here are some initial recommendations:\n\n**Format Suggestions:**\n- Day 1: Business track focusing on AI strategy and ROI\n- Day 2: Technical deep-dives and workshops\n- Day 3: Hands-on labs and networking\n\n**Key Speaker Categories:**\n- AI research leaders\n- Industry implementation experts\n- Ethics and policy specialists\n- Startup founders using AI\n\nWould you like me to help develop a specific agenda or focus on any particular aspect?',
    timestamp: new Date('2024-01-15T10:30:30Z'),
    conversationId: 'conv-1'
  },
  {
    id: 'msg-3',
    role: 'user',
    content: 'That sounds great! Can you help me create a detailed agenda for the first day focusing on the business track?',
    timestamp: new Date('2024-01-15T10:32:00Z'),
    conversationId: 'conv-1'
  },
  {
    id: 'msg-4',
    role: 'assistant',
    content: 'Perfect! Here\'s a comprehensive Day 1 agenda for the business track:\n\n**Day 1: AI Business Strategy & Implementation**\n\n**9:00-9:30 AM** - Registration & Welcome Coffee\n**9:30-10:30 AM** - Opening Keynote: "AI ROI: From Hype to Reality"\n**10:30-10:45 AM** - Coffee Break\n**10:45-11:45 AM** - Panel: "AI Transformation Stories from Fortune 500"\n**11:45 AM-12:45 PM** - Workshop: "Building Your AI Strategy Roadmap"\n**12:45-1:45 PM** - Networking Lunch\n**1:45-2:45 PM** - "Measuring AI Success: KPIs and Metrics"\n**2:45-3:00 PM** - Break\n**3:00-4:00 PM** - "AI Ethics and Governance in Business"\n**4:00-5:00 PM** - Roundtable Discussions & Next Steps\n\nWould you like me to suggest specific speakers or modify any time slots?',
    timestamp: new Date('2024-01-15T10:32:45Z'),
    conversationId: 'conv-1'
  },
  {
    id: 'msg-5',
    role: 'user',
    content: 'This is excellent! Can you also suggest some potential speakers for the opening keynote?',
    timestamp: new Date('2024-01-15T10:35:00Z'),
    conversationId: 'conv-1'
  },
  {
    id: 'msg-6',
    role: 'assistant',
    content: 'Here are some excellent keynote speaker suggestions for "AI ROI: From Hype to Reality":\n\n**Industry Leaders:**\n- **Satya Nadella** (Microsoft CEO) - Leading AI transformation at enterprise scale\n- **Demis Hassabis** (Google DeepMind) - Research to practical AI applications\n- **Jensen Huang** (NVIDIA CEO) - AI infrastructure and business impact\n\n**Business Implementation Experts:**\n- **Andrew Ng** (AI Fund) - Practical AI strategy for businesses\n- **Fei-Fei Li** (Stanford/World Labs) - AI ethics and business responsibility\n- **Kai-Fu Lee** (Sinovation Ventures) - Global AI market insights\n\n**Alternative Options:**\n- Chief AI Officers from companies like IBM, Salesforce, or Adobe\n- McKinsey/BCG AI practice leaders\n- Successful AI startup founders who scaled to enterprise\n\nI recommend reaching out to speakers 6-8 months in advance. Would you like me to help prioritize this list or suggest backup options?',
    timestamp: new Date('2024-01-15T10:36:15Z'),
    conversationId: 'conv-1'
  }
];

export const MOCK_CHAT_RESPONSES: Record<string, ChatResponse> = {
  'ai_conference_help': {
    response: 'I\'d be happy to help you create an AI conference! Based on your requirements for 300 attendees with technical and business tracks, here\'s what I recommend:\n\n**Event Structure:**\n- Duration: 2-3 days\n- Format: Hybrid (in-person + virtual)\n- Venue capacity: 350-400 (allowing for networking space)\n\n**Track Organization:**\n- Day 1: Business strategy and ROI focus\n- Day 2: Technical deep-dives and implementation\n- Day 3: Workshops and hands-on sessions\n\nWould you like me to develop specific agendas for each track?',
    suggestions: [
      'Create detailed day-by-day agenda',
      'Suggest potential keynote speakers',
      'Develop pricing strategy',
      'Plan networking activities',
      'Design workshop formats'
    ],
    followUpQuestions: [
      'What\'s your target budget range for this event?',
      'Do you have a preferred location or region?',
      'Are there specific AI topics you want to emphasize?',
      'What\'s your timeline for planning and execution?'
    ],
    conceptSuggestion: {
      title: 'AI Innovation Summit 2024',
      description: 'A comprehensive conference exploring AI applications in business and technology',
      eventDetails: {
        format: 'HYBRID',
        capacity: 300,
        duration: '3 days',
        targetAudience: 'Tech professionals, business leaders, AI practitioners'
      },
      agenda: [
        {
          time: '09:00',
          title: 'Opening Keynote: The Business of AI',
          type: 'KEYNOTE',
          duration: 60
        },
        {
          time: '10:00',
          title: 'AI Strategy Workshop',
          type: 'WORKSHOP',
          duration: 90
        }
      ]
    },
    conceptUpdates: {
      suggestions: [
        {
          field: 'eventDetails.format',
          currentValue: 'PHYSICAL',
          suggestedValue: 'HYBRID',
          reasoning: 'Hybrid format allows for broader audience reach and flexibility'
        },
        {
          field: 'eventDetails.capacity',
          currentValue: '250',
          suggestedValue: '300',
          reasoning: 'Increased capacity based on projected demand for AI content'
        }
      ]
    },
    sources: [
      {
        documentId: 'doc-1',
        filename: 'AI_Conference_Best_Practices.pdf',
        pageNumber: 15,
        section: 'Event Planning Guidelines',
        confidence: 0.92
      }
    ],
    confidence: 0.89,
    tokens: {
      prompt: 156,
      response: 203,
      total: 359
    }
  },
  'speaker_suggestions': {
    response: 'Here are some excellent speaker suggestions for your AI conference:\n\n**Keynote Speakers:**\n- Andrew Ng (AI Fund) - AI strategy and implementation\n- Fei-Fei Li (Stanford) - AI ethics and responsible development\n- Jensen Huang (NVIDIA) - AI infrastructure and hardware\n\n**Technical Track:**\n- OpenAI research team members\n- Google DeepMind researchers\n- Industry ML engineers from top tech companies\n\n**Business Track:**\n- Chief AI Officers from Fortune 500 companies\n- AI consultants from McKinsey, BCG\n- Successful AI startup founders\n\nI recommend reaching out 6-8 months in advance for top-tier speakers.',
    suggestions: [
      'Create speaker outreach timeline',
      'Develop speaker agreement templates',
      'Plan speaker travel and accommodation',
      'Design speaker promotion strategy'
    ],
    followUpQuestions: [
      'What\'s your speaker budget range?',
      'Do you prefer academic or industry speakers?',
      'Are there specific companies you want represented?',
      'Would you like help with speaker outreach emails?'
    ],
    confidence: 0.87,
    tokens: {
      prompt: 89,
      response: 178,
      total: 267
    }
  }
};

export const MOCK_CONVERSATION_HISTORY: Record<string, ChatMessage[]> = {
  'concept-1': MOCK_CHAT_MESSAGES.filter(msg => msg.conversationId === 'conv-1'),
  'concept-2': [
    {
      id: 'msg-7',
      role: 'user',
      content: 'I need help planning a sustainability workshop for business owners. It should be practical and actionable.',
      timestamp: new Date('2024-01-12T14:20:00Z'),
      conversationId: 'conv-2'
    },
    {
      id: 'msg-8',
      role: 'assistant',
      content: 'Great idea! A practical sustainability workshop is exactly what many businesses need. Here\'s my recommendation for a focused, actionable format:\n\n**Workshop Structure (1 day):**\n- Morning: Sustainability frameworks and business case\n- Afternoon: Hands-on sustainability assessment and planning\n\n**Key Elements:**\n- Interactive sustainability audit tools\n- Real case studies and success stories\n- Actionable takeaway templates\n- Peer learning and collaboration\n\nWould you like me to develop a detailed agenda or focus on specific sustainability areas like energy, waste, or supply chain?',
      timestamp: new Date('2024-01-12T14:20:45Z'),
      conversationId: 'conv-2'
    }
  ]
};

// Helper functions for mock chat
export const generateMockChatResponse = (userMessage: string, conceptId?: string): ChatResponse => {
  const lowercaseMessage = userMessage.toLowerCase();
  
  if (lowercaseMessage.includes('speaker') || lowercaseMessage.includes('keynote')) {
    return MOCK_CHAT_RESPONSES['speaker_suggestions'];
  }
  
  if (lowercaseMessage.includes('ai') || lowercaseMessage.includes('conference') || lowercaseMessage.includes('tech')) {
    return MOCK_CHAT_RESPONSES['ai_conference_help'];
  }
  
  // Default response
  return {
    response: `Thank you for your question about "${userMessage}". I'm here to help you develop and refine your event concept. Based on what you've shared, I can provide suggestions for:\n\n- Event structure and format\n- Speaker recommendations\n- Agenda development\n- Pricing strategies\n- Marketing approaches\n\nWhat specific aspect would you like to explore further?`,
    suggestions: [
      'Develop event agenda',
      'Suggest speakers and topics',
      'Create pricing structure',
      'Plan marketing strategy',
      'Design attendee experience'
    ],
    followUpQuestions: [
      'What\'s the main goal of your event?',
      'Who is your target audience?',
      'What\'s your preferred event format?',
      'Do you have a specific budget in mind?'
    ],
    confidence: 0.75,
    tokens: {
      prompt: userMessage.length,
      response: 150,
      total: userMessage.length + 150
    }
  };
}; 