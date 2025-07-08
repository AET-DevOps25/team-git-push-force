import { Concept, ConceptStatus, EventDetails, AgendaItem, Speaker, Pricing } from '../../core/models/concept.model';

export const MOCK_CONCEPTS: Concept[] = [
  {
    id: 'concept-1',
    title: 'AI Innovation Summit 2024',
    description: 'A comprehensive summit exploring the latest developments in artificial intelligence, featuring industry leaders, cutting-edge research presentations, and hands-on workshops.',
    status: 'IN_PROGRESS' as ConceptStatus,
    eventDetails: {
      theme: 'The Future of AI: Transforming Industries',
      format: 'HYBRID',
      capacity: 500,
      duration: '3 days',
      startDate: new Date('2024-03-15T09:00:00Z'),
      endDate: new Date('2024-03-17T17:00:00Z'),
      targetAudience: 'Tech professionals, researchers, and business leaders',
      objectives: [
        'Showcase latest AI breakthroughs and applications',
        'Foster networking between AI professionals',
        'Provide hands-on experience with new AI tools',
        'Discuss ethical implications of AI development'
      ],
      location: 'Tech Convention Center, San Francisco'
    },
    agenda: [
      {
        id: 'agenda-1-1',
        time: '09:00',
        title: 'Welcome & Opening Keynote',
        description: 'Introduction to the summit and keynote on the state of AI',
        type: 'KEYNOTE',
        speaker: 'Dr. Sarah Chen',
        duration: 90
      },
      {
        id: 'agenda-1-2',
        time: '10:30',
        title: 'Coffee Break & Networking',
        type: 'BREAK',
        duration: 30
      },
      {
        id: 'agenda-1-3',
        time: '11:00',
        title: 'Machine Learning in Healthcare',
        description: 'Panel discussion on AI applications in medical diagnosis and treatment',
        type: 'PANEL',
        speaker: 'Healthcare AI Panel',
        duration: 75
      },
      {
        id: 'agenda-1-4',
        time: '12:15',
        title: 'Lunch & Poster Session',
        type: 'LUNCH',
        duration: 75
      },
      {
        id: 'agenda-1-5',
        time: '13:30',
        title: 'Hands-on: Building with GPT APIs',
        description: 'Interactive workshop on integrating large language models',
        type: 'WORKSHOP',
        speaker: 'Mark Rodriguez',
        duration: 120
      }
    ],
    speakers: [
      {
        id: 'speaker-1-1',
        name: 'Dr. Sarah Chen',
        expertise: 'Machine Learning, Neural Networks',
        suggestedTopic: 'The Evolution of Deep Learning: From Research to Production',
        bio: 'Leading AI researcher with 15+ years experience in machine learning and neural network architectures.',
        confirmed: true
      },
      {
        id: 'speaker-1-2',
        name: 'Mark Rodriguez',
        expertise: 'Natural Language Processing, API Development',
        suggestedTopic: 'Practical Implementation of Large Language Models',
        bio: 'Senior engineer specializing in NLP applications and API design for AI systems.',
        confirmed: true
      },
      {
        id: 'speaker-1-3',
        name: 'Dr. Emily Watson',
        expertise: 'AI Ethics, Healthcare AI',
        suggestedTopic: 'Ethical Considerations in Medical AI',
        bio: 'Medical AI researcher focused on ethical implementation of AI in healthcare settings.',
        confirmed: false
      }
    ],
    pricing: {
      currency: 'USD',
      earlyBird: 299,
      regular: 399,
      vip: 599,
      student: 99,
      group: 249
    },
    notes: 'Consider adding more interactive sessions. Need to confirm venue A/V capabilities.',
    tags: ['AI', 'Technology', 'Innovation', 'Healthcare', 'Workshop'],
    version: 3,
    createdAt: new Date('2024-01-10T14:30:00Z'),
    updatedAt: new Date('2024-01-15T16:45:00Z'),
    userId: 'user-1',
    lastModifiedBy: 'user-1'
  },
  {
    id: 'concept-2',
    title: 'Sustainable Business Practices Workshop',
    description: 'An intensive workshop focused on implementing sustainable business practices, covering environmental impact, social responsibility, and economic viability.',
    status: 'DRAFT' as ConceptStatus,
    eventDetails: {
      theme: 'Green Business: Profit with Purpose',
      format: 'PHYSICAL',
      capacity: 150,
      duration: '1 day',
      startDate: new Date('2024-04-20T08:30:00Z'),
      endDate: new Date('2024-04-20T17:30:00Z'),
      targetAudience: 'Business owners, sustainability managers, consultants',
      objectives: [
        'Learn sustainable business frameworks',
        'Develop actionable sustainability plans',
        'Network with sustainability leaders',
        'Understand regulatory requirements'
      ],
      location: 'Green Business Center, Portland'
    },
    agenda: [
      {
        id: 'agenda-2-1',
        time: '08:30',
        title: 'Registration & Welcome Coffee',
        type: 'NETWORKING',
        duration: 30
      },
      {
        id: 'agenda-2-2',
        time: '09:00',
        title: 'Sustainable Business Fundamentals',
        description: 'Overview of sustainability frameworks and business case',
        type: 'KEYNOTE',
        speaker: 'Jessica Green',
        duration: 60
      },
      {
        id: 'agenda-2-3',
        time: '10:00',
        title: 'Interactive Workshop: Sustainability Assessment',
        description: 'Hands-on session to assess your business sustainability',
        type: 'WORKSHOP',
        speaker: 'Sustainability Team',
        duration: 90
      }
    ],
    speakers: [
      {
        id: 'speaker-2-1',
        name: 'Jessica Green',
        expertise: 'Sustainability Consulting, Environmental Management',
        suggestedTopic: 'Building Sustainable Business Models',
        bio: 'Sustainability consultant with 10+ years helping businesses reduce environmental impact.',
        confirmed: true
      }
    ],
    pricing: {
      currency: 'USD',
      earlyBird: 149,
      regular: 199,
      student: 49,
      group: 129
    },
    notes: 'Need to finalize catering options - focus on local, sustainable food providers.',
    tags: ['Sustainability', 'Business', 'Environment', 'Workshop'],
    version: 1,
    createdAt: new Date('2024-01-12T10:15:00Z'),
    updatedAt: new Date('2024-01-12T10:15:00Z'),
    userId: 'user-2',
    lastModifiedBy: 'user-2'
  },
  {
    id: 'concept-3',
    title: 'Digital Marketing Masterclass 2024',
    description: 'Comprehensive masterclass covering modern digital marketing strategies, tools, and techniques for businesses of all sizes.',
    status: 'COMPLETED' as ConceptStatus,
    eventDetails: {
      theme: 'Digital Marketing in the AI Era',
      format: 'VIRTUAL',
      capacity: 1000,
      duration: '2 days',
      startDate: new Date('2024-02-10T10:00:00Z'),
      endDate: new Date('2024-02-11T16:00:00Z'),
      targetAudience: 'Marketers, business owners, freelancers',
      objectives: [
        'Master digital marketing fundamentals',
        'Learn AI-powered marketing tools',
        'Develop data-driven marketing strategies',
        'Build effective social media campaigns'
      ],
      location: 'Virtual Event Platform'
    },
    agenda: [
      {
        id: 'agenda-3-1',
        time: '10:00',
        title: 'Digital Marketing Landscape Overview',
        description: 'Current trends and future predictions in digital marketing',
        type: 'KEYNOTE',
        speaker: 'Alex Thompson',
        duration: 45
      },
      {
        id: 'agenda-3-2',
        time: '10:45',
        title: 'AI Tools for Marketers',
        description: 'Practical session on using AI for content creation and analysis',
        type: 'WORKSHOP',
        speaker: 'Lisa Chang',
        duration: 90
      },
      {
        id: 'agenda-3-3',
        time: '12:15',
        title: 'Virtual Networking Session',
        type: 'NETWORKING',
        duration: 45
      }
    ],
    speakers: [
      {
        id: 'speaker-3-1',
        name: 'Alex Thompson',
        expertise: 'Digital Marketing Strategy, Brand Management',
        suggestedTopic: 'The Future of Digital Marketing',
        bio: 'Digital marketing expert with 12+ years experience leading campaigns for Fortune 500 companies.',
        confirmed: true
      },
      {
        id: 'speaker-3-2',
        name: 'Lisa Chang',
        expertise: 'Marketing Automation, AI Tools',
        suggestedTopic: 'AI-Powered Marketing Automation',
        bio: 'Marketing technologist specializing in AI-driven marketing solutions.',
        confirmed: true
      }
    ],
    pricing: {
      currency: 'USD',
      earlyBird: 99,
      regular: 149,
      student: 29,
      group: 79
    },
    notes: 'Event completed successfully. 847 attendees. High satisfaction scores.',
    tags: ['Digital Marketing', 'AI', 'Social Media', 'Virtual Event'],
    version: 5,
    createdAt: new Date('2023-12-15T09:00:00Z'),
    updatedAt: new Date('2024-02-12T10:30:00Z'),
    userId: 'user-3',
    lastModifiedBy: 'user-3'
  },
  {
    id: 'concept-4',
    title: 'Product Management Bootcamp',
    description: 'Intensive bootcamp for aspiring and experienced product managers covering strategy, roadmapping, and stakeholder management.',
    status: 'ARCHIVED' as ConceptStatus,
    eventDetails: {
      theme: 'Building Products That Matter',
      format: 'HYBRID',
      capacity: 80,
      duration: '5 days',
      startDate: new Date('2024-01-22T09:00:00Z'),
      endDate: new Date('2024-01-26T17:00:00Z'),
      targetAudience: 'Product managers, business analysts, entrepreneurs',
      objectives: [
        'Learn product strategy frameworks',
        'Master user research techniques',
        'Develop roadmapping skills',
        'Practice stakeholder communication'
      ],
      location: 'Innovation Hub, Austin'
    },
    agenda: [],
    speakers: [],
    pricing: {
      currency: 'USD',
      regular: 1299,
      earlyBird: 999,
      student: 399
    },
    notes: 'Event archived due to low enrollment. Consider restructuring for future offering.',
    tags: ['Product Management', 'Strategy', 'Leadership', 'Bootcamp'],
    version: 2,
    createdAt: new Date('2023-11-01T12:00:00Z'),
    updatedAt: new Date('2024-01-05T14:20:00Z'),
    userId: 'user-1',
    lastModifiedBy: 'user-1'
  }
];

// Helper function to get concepts by user
export const getConceptsByUser = (userId: string): Concept[] => {
  return MOCK_CONCEPTS.filter(concept => concept.userId === userId);
};

// Helper function to get concepts by status
export const getConceptsByStatus = (status: ConceptStatus): Concept[] => {
  return MOCK_CONCEPTS.filter(concept => concept.status === status);
}; 