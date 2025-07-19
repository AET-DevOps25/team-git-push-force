import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { AppComponent } from './app.component';
import { AuthService } from './core/services/auth.service';
import { StateService } from './core/services/state.service';

describe('AppComponent', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let stateService: jasmine.SpyObj<StateService>;

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    preferences: {
      preferredEventFormat: 'HYBRID' as const,
      industry: 'Technology',
      language: 'en',
      timezone: 'UTC'
    },
    isActive: true,
    lastLoginAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', [
      'getCurrentUser',
      'isAuthenticated'
    ], {
      isAuthenticated$: of(true)
    });
    
    const stateServiceSpy = jasmine.createSpyObj('StateService', ['setUser', 'getUser']);

    await TestBed.configureTestingModule({
      imports: [
        AppComponent,
        HttpClientTestingModule,
        NoopAnimationsModule,
        RouterTestingModule
      ],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: StateService, useValue: stateServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { data: {} },
            params: of({}),
            queryParams: of({})
          }
        }
      ]
    }).compileComponents();

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    stateService = TestBed.inject(StateService) as jasmine.SpyObj<StateService>;
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should have the correct title', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('AI Event Concepter');
  });

  it('should initialize isAuthenticated$ observable from authService', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.isAuthenticated$).toBe(authService.isAuthenticated$);
  });

  describe('ngOnInit', () => {
    it('should call initializeApp on component initialization', () => {
      authService.getCurrentUser.and.returnValue(null);
      authService.isAuthenticated.and.returnValue(false);
      
      const fixture = TestBed.createComponent(AppComponent);
      const app = fixture.componentInstance;
      spyOn(app as any, 'initializeApp');
      
      app.ngOnInit();
      
      expect(app['initializeApp']).toHaveBeenCalled();
    });
  });

  describe('initializeApp', () => {
    it('should set user in state when user is authenticated', () => {
      authService.getCurrentUser.and.returnValue(mockUser);
      authService.isAuthenticated.and.returnValue(true);
      
      const fixture = TestBed.createComponent(AppComponent);
      fixture.detectChanges(); // This triggers ngOnInit -> initializeApp
      
      expect(authService.getCurrentUser).toHaveBeenCalled();
      expect(authService.isAuthenticated).toHaveBeenCalled();
      expect(stateService.setUser).toHaveBeenCalledWith(mockUser);
    });

    it('should not set user in state when user is not authenticated', () => {
      authService.getCurrentUser.and.returnValue(mockUser);
      authService.isAuthenticated.and.returnValue(false);
      
      const fixture = TestBed.createComponent(AppComponent);
      fixture.detectChanges(); // This triggers ngOnInit -> initializeApp
      
      expect(authService.getCurrentUser).toHaveBeenCalled();
      expect(authService.isAuthenticated).toHaveBeenCalled();
      expect(stateService.setUser).not.toHaveBeenCalled();
    });

    it('should not set user in state when no user exists', () => {
      authService.getCurrentUser.and.returnValue(null);
      authService.isAuthenticated.and.returnValue(false);
      
      const fixture = TestBed.createComponent(AppComponent);
      fixture.detectChanges(); // This triggers ngOnInit -> initializeApp
      
      expect(authService.getCurrentUser).toHaveBeenCalled();
      expect(stateService.setUser).not.toHaveBeenCalled();
    });

    it('should handle case where user exists but authentication check fails', () => {
      authService.getCurrentUser.and.returnValue(null);
      authService.isAuthenticated.and.returnValue(true);
      
      const fixture = TestBed.createComponent(AppComponent);
      fixture.detectChanges(); // This triggers ngOnInit -> initializeApp
      
      expect(authService.getCurrentUser).toHaveBeenCalled();
      expect(stateService.setUser).not.toHaveBeenCalled();
    });
  });
});
