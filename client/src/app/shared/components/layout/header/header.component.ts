import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { Observable } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { StateService } from '../../../../core/services/state.service';
import { User } from '../../../../core/models';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatBadgeModule,
    MatDividerModule
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  user$: Observable<User | null>;

  constructor(
    private authService: AuthService,
    private stateService: StateService
  ) {
    this.user$ = this.stateService.getUser();
  }

  logout(): void {
    this.authService.logout();
  }
} 