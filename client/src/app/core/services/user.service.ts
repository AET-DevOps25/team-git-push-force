import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { User, UpdateUserRequest } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(
    private apiService: ApiService
  ) {}

  // Get current user profile
  getUserProfile(): Observable<User> {
    return this.apiService.get<User>('/api/users/profile');
  }

  // Update user profile
  updateUserProfile(updates: UpdateUserRequest): Observable<User> {
    return this.apiService.put<User>('/api/users/profile', updates);
  }
} 