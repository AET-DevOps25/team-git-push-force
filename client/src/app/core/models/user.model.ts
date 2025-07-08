export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  preferences: UserPreferences;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  preferredEventFormat: 'PHYSICAL' | 'VIRTUAL' | 'HYBRID';
  industry: string;
  language: string;
  timezone: string;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  preferences?: UserPreferences;
  isActive?: boolean;
} 