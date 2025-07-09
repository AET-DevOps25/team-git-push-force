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
    response: 'Great idea for an AI conference! For 300 attendees with technical and business tracks, I suggest a 2-day hybrid format. This would allow both in-person engagement and broader virtual reach.',
    suggestions: [],
    followUpQuestions: [
      'What\'s your target budget?',
      'Do you have a preferred location?',
      'What specific AI topics interest you most?'
    ],
    conceptUpdates: {
      suggestions: [
        {
          field: 'eventDetails.format',
          currentValue: 'PHYSICAL',
          suggestedValue: 'HYBRID',
          reasoning: 'Hybrid format allows for broader audience reach and flexibility, especially for AI conferences where remote participation is common'
        },
        {
          field: 'eventDetails.capacity',
          currentValue: '200',
          suggestedValue: '300',
          reasoning: 'Increased capacity to accommodate the growing interest in AI topics and allow for networking opportunities'
        },
        {
          field: 'eventDetails.duration',
          currentValue: '1 day',
          suggestedValue: '2 days',
          reasoning: 'Two days allows proper separation of business and technical tracks with adequate networking time'
        }
      ]
    },
    confidence: 0.85
  },
  'speaker_suggestions': {
    response: 'For an AI conference, I recommend reaching out to industry leaders, researchers, and practitioners. Here are some speaker categories to consider.',
    suggestions: [],
    followUpQuestions: [
      'What\'s your speaker budget range?',
      'Any specific companies you want to target?',
      'Preference for academic vs industry speakers?'
    ],
    conceptSuggestion: {
      speakers: [
        {
          name: 'Dr. Sarah Chen',
          expertise: 'Machine Learning Research',
          suggestedTopic: 'The Future of AI in Enterprise',
          bio: 'Leading AI researcher with 10+ years in industry applications'
        },
        {
          name: 'Marcus Rodriguez',
          expertise: 'AI Product Strategy',
          suggestedTopic: 'Building AI Products That Scale',
          bio: 'Former Google AI PM, now Chief Product Officer at AI startup'
        }
      ],
      reasoning: 'Mix of academic and industry perspectives provides balanced content for both technical and business tracks'
    },
    confidence: 0.80
  },
  'agenda_help': {
    response: 'Here\'s a suggested agenda structure that balances business and technical content across two days.',
    suggestions: [],
    followUpQuestions: [
      'How long should each session be?',
      'Do you want parallel tracks?',
      'Any specific topics to emphasize?'
    ],
    conceptSuggestion: {
      agenda: [
        {
          time: '09:00',
          title: 'Opening Keynote: AI Transformation',
          type: 'KEYNOTE',
          duration: 60,
          description: 'Setting the stage for AI adoption in business'
        },
        {
          time: '10:30',
          title: 'Coffee & Networking',
          type: 'BREAK',
          duration: 30
        },
        {
          time: '11:00',
          title: 'AI ROI Workshop',
          type: 'WORKSHOP',
          duration: 90,
          description: 'Hands-on session on measuring AI project success'
        }
      ],
      reasoning: 'Balanced mix of presentations, workshops, and networking opportunities'
    },
    confidence: 0.88
  }
};

// Removed MOCK_CONVERSATION_HISTORY as it was unused - conversation history is managed in the interceptor/service layer

// Helper functions for mock chat
export const generateMockChatResponse = (userMessage: string, conceptId?: string): ChatResponse => {
  const lowercaseMessage = userMessage.toLowerCase();
  
  // Simple keyword-based routing for mock responses
  if (lowercaseMessage.includes('speaker') || lowercaseMessage.includes('keynote')) {
    return MOCK_CHAT_RESPONSES['speaker_suggestions'];
  }
  
  if (lowercaseMessage.includes('agenda') || lowercaseMessage.includes('schedule') || lowercaseMessage.includes('timeline')) {
    // Context-aware agenda suggestions based on existing agenda
    return {
      response: 'I can help enhance your agenda! Based on your current schedule, I suggest some improvements and additions.',
      suggestions: [],
      followUpQuestions: [
        'Would you like more networking time?',
        'Should we add interactive workshops?',
        'Do you want to adjust session timing?'
      ],
      conceptSuggestion: {
        agenda: [
          {
            time: '12:45',
            title: 'Networking Lunch & Exhibition',
            type: 'NETWORKING',
            duration: 75,
            description: 'Extended networking opportunity with sponsor exhibition'
          },
          {
            time: '14:15',
            title: 'Interactive AI Demo Lab',
            type: 'WORKSHOP',
            duration: 90,
            description: 'Hands-on demonstrations of latest AI tools and platforms'
          }
        ],
        reasoning: 'Added longer networking session and interactive demos to balance theoretical content with practical engagement'
      },
      conceptUpdates: {
        suggestions: [
          {
            field: 'agenda[0].duration',
            currentValue: '90',
            suggestedValue: '75',
            reasoning: 'Shorter opening keynote allows for more interactive sessions and better audience engagement'
          }
        ]
      },
      confidence: 0.88
    };
  }
  
  if (lowercaseMessage.includes('ai') || lowercaseMessage.includes('conference') || lowercaseMessage.includes('tech') || lowercaseMessage.includes('event')) {
    return MOCK_CHAT_RESPONSES['ai_conference_help'];
  }
  
  // Default response for any other message
  return {
    response: `Thanks for your question! I can help you with event planning. Here are some areas I can assist with:\n\n• Event structure and format\n• Speaker recommendations\n• Agenda development\n• Pricing strategies\n• Marketing approaches\n\nWhat would you like to focus on?`,
    suggestions: [],
    followUpQuestions: [
      'What\'s your main event goal?',
      'Who is your target audience?',
      'What\'s your preferred format?'
    ],
    confidence: 0.75
  };
}; 