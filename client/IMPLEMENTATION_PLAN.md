# AI Event Concepter - Implementation Plan

## 🎯 Project Overview

Building a modern Angular application for AI-powered event concept creation with Angular Material, comprehensive testing, and mock API capabilities.

### Key Features
- Authentication (Login/Register)
- Concept management (CRUD operations)
- AI-powered chat interface for concept refinement
- Document upload and management
- PDF export functionality
- Responsive design with Angular Material

---

## 📋 Prerequisites

- [x] Angular CLI 19.x installed
- [x] Node.js 22+ installed
- [x] Basic Angular project structure exists
- [x] Angular Material setup
- [x] Project dependencies installed

---

## 🚀 Phase 1: Project Setup & Core Infrastructure

### 1.1 Dependencies Installation

```bash
# Install Angular Material and CDK
ng add @angular/material

# Install additional dependencies
npm install moment @angular/material-moment-adapter
npm install --save-dev cypress @types/node

# Install RxJS operators (if not already included)
npm install rxjs
```

### 1.2 Project Configuration

#### Update `angular.json` for Material Icons
```json
"styles": [
  "./node_modules/@angular/material/prebuilt-themes/indigo-pink.css",
  "https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500&display=swap",
  "https://fonts.googleapis.com/icon?family=Material+Icons",
  "src/styles.scss"
]
```

#### Environment Configuration
**File:** `src/environments/environment.ts`
```typescript
export const environment = {
  production: false,
  useMockApi: true,
  apiUrl: 'http://localhost:8080',
  mockDelay: 800,
  enableLogging: true
};
```

**File:** `src/environments/environment.prod.ts`
```typescript
export const environment = {
  production: true,
  useMockApi: false,
  apiUrl: 'https://aieventconcepter.student.k8s.aet.cit.tum.de/api',
  mockDelay: 0,
  enableLogging: false
};
```

### 1.3 Folder Structure Creation

**TODO:** Create the following folder structure:

```
src/app/
├── core/
│   ├── guards/
│   ├── interceptors/
│   ├── services/
│   └── models/
├── shared/
│   ├── components/
│   │   ├── layout/
│   │   └── common/
│   ├── pipes/
│   └── directives/
├── features/
│   ├── auth/
│   ├── dashboard/
│   ├── concepts/
│   ├── concept-detail/
│   └── profile/
├── mocks/
│   ├── data/
│   └── services/
└── styles/
    ├── abstracts/
    ├── base/
    ├── components/
    ├── layout/
    └── themes/
```

---

## 🎨 Phase 2: Design System & Angular Material Setup

### 2.1 Material Theme Configuration

**File:** `src/styles/abstracts/_material-theme.scss`
```scss
@use '@angular/material' as mat;

// Include the common styles for Angular Material
@include mat.core();

// Define custom color palettes
$concepter-primary: mat.define-palette((
  50: #e3f2fd,
  100: #bbdefb,
  200: #90caf9,
  300: #64b5f6,
  400: #42a5f5,
  500: #2196f3,
  600: #1e88e5,
  700: #1976d2,
  800: #1565c0,
  900: #0d47a1,
  contrast: (
    50: rgba(black, 0.87),
    100: rgba(black, 0.87),
    200: rgba(black, 0.87),
    300: rgba(black, 0.87),
    400: rgba(black, 0.87),
    500: white,
    600: white,
    700: white,
    800: white,
    900: white,
  )
));

$concepter-accent: mat.define-palette(mat.$pink-palette, A200, A100, A400);
$concepter-warn: mat.define-palette(mat.$red-palette);

// Create the theme
$concepter-theme: mat.define-light-theme((
  color: (
    primary: $concepter-primary,
    accent: $concepter-accent,
    warn: $concepter-warn,
  ),
  typography: mat.define-typography-config(),
  density: 0,
));

// Include theme styles for core and each component
@include mat.all-component-themes($concepter-theme);
```

### 2.2 Design Tokens

**File:** `src/styles/abstracts/_variables.scss`
```scss
// Spacing tokens
$spacing-xs: 0.25rem;   // 4px
$spacing-sm: 0.5rem;    // 8px
$spacing-md: 1rem;      // 16px
$spacing-lg: 1.5rem;    // 24px
$spacing-xl: 2rem;      // 32px
$spacing-2xl: 3rem;     // 48px

// Border radius
$radius-sm: 0.25rem;
$radius-md: 0.5rem;
$radius-lg: 0.75rem;
$radius-xl: 1rem;

// Shadows
$shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
$shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
$shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);

// Z-index scale
$z-dropdown: 1000;
$z-sticky: 1020;
$z-fixed: 1030;
$z-modal-backdrop: 1040;
$z-modal: 1050;
$z-popover: 1060;
$z-tooltip: 1070;

// Semantic colors
$success: #10b981;
$warning: #f59e0b;
$error: #ef4444;
$info: #3b82f6;

// Status colors for concepts
$status-draft: #6b7280;
$status-in-progress: #f59e0b;
$status-completed: #10b981;
$status-archived: #9ca3af;
```

### 2.3 Global Styles Setup

**File:** `src/styles.scss`
```scss
@import './styles/abstracts/variables';
@import './styles/abstracts/material-theme';
@import './styles/base/reset';
@import './styles/base/typography';
@import './styles/layout/grid';

// Global utility classes
.text-center { text-align: center; }
.text-left { text-align: left; }
.text-right { text-align: right; }

.mt-sm { margin-top: $spacing-sm; }
.mt-md { margin-top: $spacing-md; }
.mt-lg { margin-top: $spacing-lg; }

.mb-sm { margin-bottom: $spacing-sm; }
.mb-md { margin-bottom: $spacing-md; }
.mb-lg { margin-bottom: $spacing-lg; }

// Custom Material overrides
.mat-mdc-card {
  box-shadow: $shadow-md;
  border-radius: $radius-lg;
}

.mat-mdc-button {
  border-radius: $radius-md;
}
```

---

## 🔧 Phase 3: Core Services & Models

### 3.1 Data Models

**File:** `src/app/core/models/user.model.ts`
```typescript
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
```

**File:** `src/app/core/models/concept.model.ts`
```typescript
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
```

**File:** `src/app/core/models/chat.model.ts`
```typescript
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  conversationId?: string;
}

export interface ChatRequest {
  message: string;
  concept: Concept;
  conversationId?: string;
  userPreferences?: UserPreferences;
  context?: {
    previousMessages: ChatMessage[];
    includeDocuments: boolean;
    maxTokens: number;
  };
}

export interface ChatResponse {
  response: string;
  suggestions: string[];
  followUpQuestions: string[];
  conceptSuggestion?: any; // Will be defined based on API response
  conceptUpdates?: any;
  sources?: Source[];
  confidence: number;
  tokens?: {
    prompt: number;
    response: number;
    total: number;
  };
}

export interface Source {
  documentId: string;
  filename: string;
  pageNumber?: number;
  section?: string;
  confidence: number;
}
```

### 3.2 Generic API Service

**File:** `src/app/core/services/api.service.ts`
```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, delay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  get<T>(endpoint: string, params?: any): Observable<T> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key].toString());
        }
      });
    }

    return this.http.get<T>(`${this.baseUrl}${endpoint}`, { params: httpParams })
      .pipe(
        delay(environment.useMockApi ? environment.mockDelay : 0),
        catchError(this.handleError)
      );
  }

  post<T>(endpoint: string, data: any): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${endpoint}`, data)
      .pipe(
        delay(environment.useMockApi ? environment.mockDelay : 0),
        catchError(this.handleError)
      );
  }

  put<T>(endpoint: string, data: any): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}${endpoint}`, data)
      .pipe(
        delay(environment.useMockApi ? environment.mockDelay : 0),
        catchError(this.handleError)
      );
  }

  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}${endpoint}`)
      .pipe(
        delay(environment.useMockApi ? environment.mockDelay : 0),
        catchError(this.handleError)
      );
  }

  upload<T>(endpoint: string, formData: FormData): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${endpoint}`, formData)
      .pipe(
        delay(environment.useMockApi ? environment.mockDelay : 0),
        catchError(this.handleError)
      );
  }

  private handleError(error: any): Observable<never> {
    console.error('API Error:', error);
    return throwError(() => error);
  }
}
```

### 3.3 Application State Service

**File:** `src/app/core/services/state.service.ts`
```typescript
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { User } from '../models/user.model';
import { Concept } from '../models/concept.model';
import { ChatMessage } from '../models/chat.model';

export interface LoadingState {
  [key: string]: boolean;
}

export interface AppState {
  user: User | null;
  concepts: Concept[];
  currentConcept: Concept | null;
  chatMessages: ChatMessage[];
  loading: LoadingState;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class StateService {
  private readonly initialState: AppState = {
    user: null,
    concepts: [],
    currentConcept: null,
    chatMessages: [],
    loading: {},
    error: null
  };

  private state$ = new BehaviorSubject<AppState>(this.initialState);

  // Selectors
  getState(): Observable<AppState> {
    return this.state$.asObservable();
  }

  getUser(): Observable<User | null> {
    return new BehaviorSubject(this.state$.value.user).asObservable();
  }

  getConcepts(): Observable<Concept[]> {
    return new BehaviorSubject(this.state$.value.concepts).asObservable();
  }

  getCurrentConcept(): Observable<Concept | null> {
    return new BehaviorSubject(this.state$.value.currentConcept).asObservable();
  }

  isLoading(key: string): Observable<boolean> {
    return new BehaviorSubject(this.state$.value.loading[key] || false).asObservable();
  }

  // Actions
  setUser(user: User | null): void {
    this.updateState({ user });
  }

  setConcepts(concepts: Concept[]): void {
    this.updateState({ concepts });
  }

  addConcept(concept: Concept): void {
    const concepts = [...this.state$.value.concepts, concept];
    this.updateState({ concepts });
  }

  updateConcept(updatedConcept: Concept): void {
    const concepts = this.state$.value.concepts.map(concept => 
      concept.id === updatedConcept.id ? updatedConcept : concept
    );
    this.updateState({ concepts });
    
    if (this.state$.value.currentConcept?.id === updatedConcept.id) {
      this.updateState({ currentConcept: updatedConcept });
    }
  }

  setCurrentConcept(concept: Concept | null): void {
    this.updateState({ currentConcept: concept });
  }

  addChatMessage(message: ChatMessage): void {
    const chatMessages = [...this.state$.value.chatMessages, message];
    this.updateState({ chatMessages });
  }

  setChatMessages(messages: ChatMessage[]): void {
    this.updateState({ chatMessages: messages });
  }

  setLoading(key: string, isLoading: boolean): void {
    const loading = { ...this.state$.value.loading, [key]: isLoading };
    this.updateState({ loading });
  }

  setError(error: string | null): void {
    this.updateState({ error });
  }

  reset(): void {
    this.state$.next(this.initialState);
  }

  private updateState(partialState: Partial<AppState>): void {
    this.state$.next({ ...this.state$.value, ...partialState });
  }
}
```

### 3.4 Storage Service

**File:** `src/app/core/services/storage.service.ts`
```typescript
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private isLocalStorageAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  setItem(key: string, value: any): void {
    if (this.isLocalStorageAvailable()) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
    }
  }

  getItem<T>(key: string): T | null {
    if (this.isLocalStorageAvailable()) {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
      } catch (error) {
        console.error('Error reading from localStorage:', error);
        return null;
      }
    }
    return null;
  }

  removeItem(key: string): void {
    if (this.isLocalStorageAvailable()) {
      localStorage.removeItem(key);
    }
  }

  clear(): void {
    if (this.isLocalStorageAvailable()) {
      localStorage.clear();
    }
  }
}
```

---

## 🔐 Phase 4: Authentication System

### 4.1 Authentication Service

**File:** `src/app/core/services/auth.service.ts`
```typescript
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import { StorageService } from './storage.service';
import { StateService } from './state.service';
import { User } from '../models/user.model';
import { environment } from '../../../environments/environment';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  preferences?: any;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_KEY = 'current_user';

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private apiService: ApiService,
    private storageService: StorageService,
    private stateService: StateService,
    private router: Router
  ) {
    this.initializeAuth();
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.apiService.post<AuthResponse>('/auth/login', credentials)
      .pipe(
        tap(response => {
          this.handleAuthSuccess(response);
        }),
        catchError(error => {
          this.stateService.setError('Login failed. Please check your credentials.');
          throw error;
        })
      );
  }

  register(userData: RegisterRequest): Observable<AuthResponse> {
    return this.apiService.post<AuthResponse>('/auth/register', userData)
      .pipe(
        tap(response => {
          this.handleAuthSuccess(response);
        }),
        catchError(error => {
          this.stateService.setError('Registration failed. Please try again.');
          throw error;
        })
      );
  }

  logout(): void {
    this.apiService.post('/auth/logout', {}).subscribe({
      next: () => {
        this.clearAuth();
        this.router.navigate(['/auth/login']);
      },
      error: () => {
        // Clear local auth even if server request fails
        this.clearAuth();
        this.router.navigate(['/auth/login']);
      }
    });
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.storageService.getItem<string>(this.REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      this.logout();
      return of();
    }

    return this.apiService.post<AuthResponse>('/auth/refresh', { refreshToken })
      .pipe(
        tap(response => {
          this.handleAuthSuccess(response);
        }),
        catchError(() => {
          this.logout();
          return of();
        })
      );
  }

  getCurrentUser(): User | null {
    return this.storageService.getItem<User>(this.USER_KEY);
  }

  getToken(): string | null {
    return this.storageService.getItem<string>(this.TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenExpired(token);
  }

  private initializeAuth(): void {
    const user = this.getCurrentUser();
    const isAuth = this.isAuthenticated();
    
    if (isAuth && user) {
      this.stateService.setUser(user);
      this.isAuthenticatedSubject.next(true);
    } else {
      this.clearAuth();
    }
  }

  private handleAuthSuccess(response: AuthResponse): void {
    this.storageService.setItem(this.TOKEN_KEY, response.accessToken);
    this.storageService.setItem(this.REFRESH_TOKEN_KEY, response.refreshToken);
    this.storageService.setItem(this.USER_KEY, response.user);
    
    this.stateService.setUser(response.user);
    this.isAuthenticatedSubject.next(true);
    this.stateService.setError(null);
  }

  private clearAuth(): void {
    this.storageService.removeItem(this.TOKEN_KEY);
    this.storageService.removeItem(this.REFRESH_TOKEN_KEY);
    this.storageService.removeItem(this.USER_KEY);
    
    this.stateService.setUser(null);
    this.isAuthenticatedSubject.next(false);
    this.stateService.reset();
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }
}
```

### 4.2 Guards

**File:** `src/app/core/guards/auth.guard.ts`
```typescript
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    if (this.authService.isAuthenticated()) {
      return true;
    }

    this.router.navigate(['/auth/login']);
    return false;
  }
}
```

**File:** `src/app/core/guards/guest.guard.ts`
```typescript
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class GuestGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    if (!this.authService.isAuthenticated()) {
      return true;
    }

    this.router.navigate(['/dashboard']);
    return false;
  }
}
```

### 4.3 Interceptors

**File:** `src/app/core/interceptors/auth.interceptor.ts`
```typescript
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler } from '@angular/common/http';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    const token = this.authService.getToken();
    
    if (token) {
      const authReq = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      });
      return next.handle(authReq);
    }
    
    return next.handle(req);
  }
}
```

**File:** `src/app/core/interceptors/error.interceptor.ts`
```typescript
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpErrorResponse } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { StateService } from '../services/state.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(
    private authService: AuthService,
    private stateService: StateService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.authService.logout();
        } else if (error.status >= 500) {
          this.stateService.setError('Server error. Please try again later.');
        }
        return throwError(() => error);
      })
    );
  }
}
```

---

## 🧱 Phase 5: Shared Components

### 5.1 Layout Components

**File:** `src/app/shared/components/layout/header/header.component.ts`
```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { StateService } from '../../../../core/services/state.service';
import { User } from '../../../../core/models/user.model';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule
  ],
  template: `
    <mat-toolbar color="primary">
      <span>AI Event Concepter</span>
      
      <span class="spacer"></span>
      
      <ng-container *ngIf="user$ | async as user; else loginButton">
        <button mat-button [matMenuTriggerFor]="userMenu">
          <mat-icon>account_circle</mat-icon>
          {{ user.firstName }} {{ user.lastName }}
        </button>
        
        <mat-menu #userMenu="matMenu">
          <button mat-menu-item (click)="navigateToProfile()">
            <mat-icon>person</mat-icon>
            Profile
          </button>
          <button mat-menu-item (click)="logout()">
            <mat-icon>logout</mat-icon>
            Logout
          </button>
        </mat-menu>
      </ng-container>
      
      <ng-template #loginButton>
        <button mat-button (click)="navigateToLogin()">
          Login
        </button>
      </ng-template>
    </mat-toolbar>
  `,
  styles: [`
    .spacer {
      flex: 1 1 auto;
    }
  `]
})
export class HeaderComponent implements OnInit {
  user$: Observable<User | null>;

  constructor(
    private authService: AuthService,
    private stateService: StateService,
    private router: Router
  ) {
    this.user$ = this.stateService.getUser();
  }

  ngOnInit(): void {}

  navigateToProfile(): void {
    this.router.navigate(['/profile']);
  }

  navigateToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  logout(): void {
    this.authService.logout();
  }
}
```

### 5.2 Common Components

**File:** `src/app/shared/components/common/file-upload/file-upload.component.ts`
```typescript
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule
  ],
  template: `
    <mat-card class="upload-area" 
              [class.dragover]="isDragOver"
              (dragover)="onDragOver($event)"
              (dragleave)="onDragLeave($event)"
              (drop)="onDrop($event)">
      
      <div class="upload-content" *ngIf="!isUploading">
        <mat-icon class="upload-icon">cloud_upload</mat-icon>
        <h3>Upload Documents</h3>
        <p>Drag & drop files here or click to browse</p>
        <p class="file-types">Supported: PDF, DOC, DOCX, TXT</p>
        
        <input type="file" 
               #fileInput
               multiple
               accept=".pdf,.doc,.docx,.txt"
               (change)="onFileSelected($event)"
               style="display: none">
        
        <button mat-raised-button 
                color="primary"
                (click)="fileInput.click()">
          Choose Files
        </button>
      </div>
      
      <div class="upload-progress" *ngIf="isUploading">
        <mat-icon>file_upload</mat-icon>
        <p>Uploading files...</p>
        <mat-progress-bar mode="indeterminate"></mat-progress-bar>
      </div>
    </mat-card>
  `,
  styles: [`
    .upload-area {
      border: 2px dashed #ccc;
      border-radius: 8px;
      padding: 2rem;
      text-align: center;
      cursor: pointer;
      transition: border-color 0.3s ease;
    }
    
    .upload-area.dragover {
      border-color: var(--primary-color);
      background-color: rgba(63, 81, 181, 0.05);
    }
    
    .upload-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #666;
      margin-bottom: 1rem;
    }
    
    .file-types {
      font-size: 0.875rem;
      color: #666;
      margin-bottom: 1rem;
    }
    
    .upload-progress {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }
  `]
})
export class FileUploadComponent {
  @Input() acceptedTypes: string[] = ['.pdf', '.doc', '.docx', '.txt'];
  @Input() multiple: boolean = true;
  @Input() isUploading: boolean = false;
  
  @Output() filesSelected = new EventEmitter<FileList>();
  
  isDragOver = false;

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.filesSelected.emit(files);
    }
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      this.filesSelected.emit(target.files);
    }
  }
}
```

---

## 📝 TODO List & Next Steps

### Phase 1 TODOs (Setup)
- [x] Install Angular Material and dependencies
- [x] Create environment files
- [x] Set up folder structure
- [x] Configure angular.json for Material icons

### Phase 2 TODOs (Design System)
- [ ] Create Material theme configuration
- [ ] Set up design tokens (_variables.scss)
- [ ] Configure global styles
- [ ] Create utility classes

### Phase 3 TODOs (Core Services)
- [ ] Implement all data models
- [ ] Create API service with error handling
- [ ] Build state management service
- [ ] Add storage service for local data

### Phase 4 TODOs (Authentication)
- [ ] Implement authentication service
- [ ] Create auth and guest guards
- [ ] Add HTTP interceptors
- [ ] Set up token refresh logic

### Phase 5 TODOs (Shared Components)
- [ ] Build header component with user menu
- [ ] Create file upload component
- [ ] Add confirmation dialog component
- [ ] Implement chat interface component

### Phase 6 TODOs (Feature Modules) - Next Sprint
- [ ] Authentication pages (login/register)
- [ ] Dashboard with concept overview
- [ ] Concepts list and CRUD operations
- [ ] Concept detail with chat integration
- [ ] Profile management

### Phase 7 TODOs (Testing & Polish)
- [ ] Write unit tests for all services
- [ ] Add component tests
- [ ] Set up E2E testing with Cypress
- [ ] Implement error handling
- [ ] Add loading states
- [ ] Responsive design testing

### Phase 8 TODOs (Mock Implementation)
- [ ] Create mock data sets
- [ ] Implement mock services
- [ ] Add environment switching
- [ ] Create realistic API simulation

---

## 🧪 Testing Strategy

### Unit Testing Setup
```bash
# Run tests
ng test

# Run tests with coverage
ng test --code-coverage
```

### Component Testing Template
```typescript
// Example: auth.service.spec.ts
describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should authenticate user successfully', () => {
    const mockResponse = { accessToken: 'token', user: mockUser };
    
    service.login(mockCredentials).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });
});
```

---

## 🚀 Development Workflow

1. **Start Development Server**
   ```bash
   ng serve
   ```

2. **Generate Components**
   ```bash
   ng generate component features/auth/components/login --standalone
   ```

3. **Run Tests**
   ```bash
   ng test
   ```

4. **Build for Production**
   ```bash
   ng build --prod
   ```

---

## 📚 Key Resources

- [Angular Material Documentation](https://material.angular.io/)
- [Angular Testing Guide](https://angular.dev/guide/testing)
- [RxJS Operators](https://rxjs.dev/guide/operators)
- [Angular Style Guide](https://angular.dev/style-guide)

---

## 🔄 Implementation Order

1. ✅ **Phase 1-2**: Project setup and design system
2. ✅ **Phase 3-4**: Core services and authentication
3. ✅ **Phase 5**: Shared components
4. 🔄 **Phase 6**: Feature modules (auth, dashboard, concepts)
5. ⏳ **Phase 7**: Testing and polish
6. ⏳ **Phase 8**: Mock implementation and deployment

Start with Phase 1 and work through each phase sequentially. Each phase should be completed and tested before moving to the next one. 