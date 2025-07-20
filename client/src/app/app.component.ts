import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './shared/components/layout/header/header.component';
import { AuthService } from './core/services/auth.service';
import { StateService } from './core/services/state.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    HeaderComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'AI Event Concepter';
  isAuthenticated$: Observable<boolean>;

  constructor(
    private authService: AuthService,
    private stateService: StateService
  ) {
    this.isAuthenticated$ = this.authService.isAuthenticated$;
  }

  ngOnInit(): void {
    // Initialize authentication state on app startup
    this.initializeApp();
  }

  private initializeApp(): void {
    // This will check if user is already logged in from localStorage
    // and set the appropriate state
    const user = this.authService.getCurrentUser();
    if (user && this.authService.isAuthenticated()) {
      this.stateService.setUser(user);
    }
  }
}
