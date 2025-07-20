import { User, UserPreferences } from '../../core/models/user.model';

export const MOCK_USERS: User[] = [
  {
    id: 'user-1',
    email: 'john.doe@example.com',
    firstName: 'John',
    lastName: 'Doe',
    preferences: {
      preferredEventFormat: 'HYBRID',
      industry: 'Technology',
      language: 'en',
      timezone: 'America/New_York'
    },
    isActive: true,
    lastLoginAt: new Date('2024-01-15T10:30:00Z'),
    createdAt: new Date('2023-12-01T08:00:00Z'),
    updatedAt: new Date('2024-01-15T10:30:00Z')
  },
  {
    id: 'user-2',
    email: 'alice.smith@company.com',
    firstName: 'Alice',
    lastName: 'Smith',
    preferences: {
      preferredEventFormat: 'PHYSICAL',
      industry: 'Healthcare',
      language: 'en',
      timezone: 'Europe/London'
    },
    isActive: true,
    lastLoginAt: new Date('2024-01-14T15:45:00Z'),
    createdAt: new Date('2023-11-20T12:00:00Z'),
    updatedAt: new Date('2024-01-14T15:45:00Z')
  },
  {
    id: 'user-3',
    email: 'demo@concepter.com',
    firstName: 'Demo',
    lastName: 'User',
    preferences: {
      preferredEventFormat: 'VIRTUAL',
      industry: 'Education',
      language: 'en',
      timezone: 'America/Los_Angeles'
    },
    isActive: true,
    lastLoginAt: new Date('2024-01-16T09:15:00Z'),
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-16T09:15:00Z')
  }
];

export const MOCK_CREDENTIALS = {
  'john.doe@example.com': 'password123',
  'alice.smith@company.com': 'securepass456',
  'demo@concepter.com': 'demo123'
};

// Default user for testing (demo user)
export const DEFAULT_MOCK_USER = MOCK_USERS[2]; 