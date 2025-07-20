import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { UserService } from './user.service';
import { ApiService } from './api.service';
import { User, UpdateUserRequest } from '../models/user.model';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;
  let apiService: jasmine.SpyObj<ApiService>;

  const mockUser: User = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    preferences: {
      preferredEventFormat: 'HYBRID',
      industry: 'Technology',
      language: 'en',
      timezone: 'Europe/Berlin'
    },
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  };

  beforeEach(() => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'put']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        UserService,
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });

    service = TestBed.inject(UserService);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getUserProfile', () => {
    it('should get user profile', () => {
      apiService.get.and.returnValue(of(mockUser));

      service.getUserProfile().subscribe(user => {
        expect(user).toEqual(mockUser);
      });

      expect(apiService.get).toHaveBeenCalledWith('/api/users/profile');
    });
  });

  describe('updateUserProfile', () => {
    it('should update user profile', () => {
      const updateRequest: UpdateUserRequest = {
        firstName: 'Jane',
        lastName: 'Smith'
      };

      const updatedUser: User = {
        ...mockUser,
        firstName: 'Jane',
        lastName: 'Smith',
        updatedAt: new Date('2024-01-02')
      };

      apiService.put.and.returnValue(of(updatedUser));

      service.updateUserProfile(updateRequest).subscribe(user => {
        expect(user).toEqual(updatedUser);
      });

      expect(apiService.put).toHaveBeenCalledWith('/api/users/profile', updateRequest);
    });

    it('should update user preferences', () => {
      const updateRequest: UpdateUserRequest = {
        preferences: {
          preferredEventFormat: 'VIRTUAL',
          industry: 'Healthcare',
          language: 'de',
          timezone: 'UTC'
        }
      };

      const updatedUser: User = {
        ...mockUser,
        preferences: updateRequest.preferences!,
        updatedAt: new Date('2024-01-02')
      };

      apiService.put.and.returnValue(of(updatedUser));

      service.updateUserProfile(updateRequest).subscribe(user => {
        expect(user).toEqual(updatedUser);
      });

      expect(apiService.put).toHaveBeenCalledWith('/api/users/profile', updateRequest);
    });

    it('should update user active status', () => {
      const updateRequest: UpdateUserRequest = {
        isActive: false
      };

      const updatedUser: User = {
        ...mockUser,
        isActive: false,
        updatedAt: new Date('2024-01-02')
      };

      apiService.put.and.returnValue(of(updatedUser));

      service.updateUserProfile(updateRequest).subscribe(user => {
        expect(user).toEqual(updatedUser);
      });

      expect(apiService.put).toHaveBeenCalledWith('/api/users/profile', updateRequest);
    });
  });
}); 