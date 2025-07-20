import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { HeaderComponent } from './header.component';
import { AuthService } from '../../../../core/services/auth.service';
import { StateService } from '../../../../core/services/state.service';
import { User } from '../../../../core/models/user.model';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let stateService: jasmine.SpyObj<StateService>;

  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    preferences: {
      preferredEventFormat: 'HYBRID',
      industry: 'Technology',
      language: 'en',
      timezone: 'UTC'
    },
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  };

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['logout']);
    const stateServiceSpy = jasmine.createSpyObj('StateService', ['getUser']);

    // Setup default return values
    stateServiceSpy.getUser.and.returnValue(of(mockUser));

    await TestBed.configureTestingModule({
      imports: [
        HeaderComponent,
        RouterTestingModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: StateService, useValue: stateServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    stateService = TestBed.inject(StateService) as jasmine.SpyObj<StateService>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize user observable', () => {
    expect(component.user$).toBeDefined();
    expect(stateService.getUser).toHaveBeenCalled();
  });

  it('should get user from state service', (done) => {
    component.user$.subscribe(user => {
      expect(user).toEqual(mockUser);
      done();
    });
  });

  it('should call logout on auth service', () => {
    component.logout();
    expect(authService.logout).toHaveBeenCalled();
  });

  it('should handle null user', (done) => {
    stateService.getUser.and.returnValue(of(null));
    
    // Re-create component to test with null user
    component = new HeaderComponent(authService, stateService);
    
    component.user$.subscribe(user => {
      expect(user).toBeNull();
      done();
    });
  });
}); 