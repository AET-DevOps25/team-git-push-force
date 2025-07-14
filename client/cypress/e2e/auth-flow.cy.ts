/// <reference types="cypress" />

describe('Authentication Flow', () => {
  beforeEach(() => {
    // Clear any existing authentication state
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  describe('Login Page', () => {
    beforeEach(() => {
      cy.visit('/auth/login');
    });

    it('should display login form', () => {
      cy.get('[data-cy=login-form]').should('be.visible');
      cy.get('[data-cy=email-input]').should('be.visible');
      cy.get('[data-cy=password-input]').should('be.visible');
      cy.get('[data-cy=login-button]').should('be.visible');
    });

    it('should show validation errors for empty form submission', () => {
      cy.get('[data-cy=login-button]').click();
      
      cy.get('[data-cy=email-error]').should('contain', 'Email is required');
      cy.get('[data-cy=password-error]').should('contain', 'Password is required');
    });

    it('should show validation error for invalid email format', () => {
      cy.get('[data-cy=email-input]').type('invalid-email');
      cy.get('[data-cy=email-input]').blur();
      
      cy.get('[data-cy=email-error]').should('contain', 'Please enter a valid email');
    });

    it('should show validation error for short password', () => {
      cy.get('[data-cy=password-input]').type('123');
      cy.get('[data-cy=password-input]').blur();
      
      cy.get('[data-cy=password-error]').should('contain', 'Password must be at least 6 characters');
    });

    it('should toggle password visibility', () => {
      cy.get('[data-cy=password-input]').should('have.attr', 'type', 'password');
      
      cy.get('[data-cy=password-toggle]').click();
      cy.get('[data-cy=password-input]').should('have.attr', 'type', 'text');
      
      cy.get('[data-cy=password-toggle]').click();
      cy.get('[data-cy=password-input]').should('have.attr', 'type', 'password');
    });

    it('should login successfully with valid credentials', () => {
      cy.get('[data-cy=email-input]').type('demo@concepter.com');
      cy.get('[data-cy=password-input]').type('demo123');
      cy.get('[data-cy=login-button]').click();

      // Should redirect to dashboard
      cy.url().should('include', '/dashboard');
      
      // Should show user info in header
      cy.get('[data-cy=user-menu]').should('be.visible');
    });

    it('should show error message for invalid credentials', () => {
      cy.get('[data-cy=email-input]').type('wrong@example.com');
      cy.get('[data-cy=password-input]').type('wrongpassword');
      cy.get('[data-cy=login-button]').click();

      cy.get('[data-cy=error-message]').should('be.visible');
      cy.get('[data-cy=error-message]').should('contain', 'Invalid credentials');
    });

    it('should remember user preference', () => {
      cy.get('[data-cy=email-input]').type('demo@concepter.com');
      cy.get('[data-cy=password-input]').type('demo123');
      cy.get('[data-cy=remember-me]').check();
      cy.get('[data-cy=login-button]').click();

      // Verify remember me is checked
      cy.get('[data-cy=remember-me]').should('be.checked');
    });

    it('should navigate to register page', () => {
      cy.get('[data-cy=register-link]').click();
      cy.url().should('include', '/auth/register');
    });
  });

  describe('Registration Page', () => {
    beforeEach(() => {
      cy.visit('/auth/register');
    });

    it('should display registration form', () => {
      cy.get('[data-cy=register-form]').should('be.visible');
      cy.get('[data-cy=first-name-input]').should('be.visible');
      cy.get('[data-cy=last-name-input]').should('be.visible');
      cy.get('[data-cy=email-input]').should('be.visible');
      cy.get('[data-cy=password-input]').should('be.visible');
      cy.get('[data-cy=register-button]').should('be.visible');
    });

    it('should complete registration flow', () => {
      // Fill basic information
      cy.get('[data-cy=first-name-input]').type('John');
      cy.get('[data-cy=last-name-input]').type('Doe');
      cy.get('[data-cy=email-input]').type('john.doe@example.com');
      cy.get('[data-cy=password-input]').type('password123');
      
      // Fill preferences if using stepper
      cy.get('[data-cy=next-button]').click();
      cy.get('[data-cy=event-format-select]').click();
      cy.get('[data-cy=hybrid-option]').click();
      cy.get('[data-cy=industry-select]').click();
      cy.get('[data-cy=technology-option]').click();
      
      cy.get('[data-cy=register-button]').click();

      // Should redirect to dashboard after successful registration
      cy.url().should('include', '/dashboard');
      cy.get('[data-cy=user-menu]').should('contain', 'John Doe');
    });

    it('should navigate back to login page', () => {
      cy.get('[data-cy=login-link]').click();
      cy.url().should('include', '/auth/login');
    });
  });

  describe('Authentication State', () => {
    it('should redirect unauthenticated users to login', () => {
      cy.visit('/dashboard');
      cy.url().should('include', '/auth/login');
      
      cy.visit('/concepts');
      cy.url().should('include', '/auth/login');
      
      cy.visit('/profile');
      cy.url().should('include', '/auth/login');
    });

    it('should allow access to protected routes after login', () => {
      // Login first
      cy.visit('/auth/login');
      cy.get('[data-cy=email-input]').type('demo@concepter.com');
      cy.get('[data-cy=password-input]').type('demo123');
      cy.get('[data-cy=login-button]').click();

      // Should be able to access protected routes
      cy.visit('/dashboard');
      cy.url().should('include', '/dashboard');
      
      cy.visit('/concepts');
      cy.url().should('include', '/concepts');
      
      cy.visit('/profile');
      cy.url().should('include', '/profile');
    });

    it('should persist authentication across browser refresh', () => {
      // Login
      cy.visit('/auth/login');
      cy.get('[data-cy=email-input]').type('demo@concepter.com');
      cy.get('[data-cy=password-input]').type('demo123');
      cy.get('[data-cy=login-button]').click();

      // Refresh the page
      cy.reload();

      // Should still be authenticated
      cy.url().should('include', '/dashboard');
      cy.get('[data-cy=user-menu]').should('be.visible');
    });
  });

  describe('Logout', () => {
    beforeEach(() => {
      // Login before each logout test
      cy.visit('/auth/login');
      cy.get('[data-cy=email-input]').type('demo@concepter.com');
      cy.get('[data-cy=password-input]').type('demo123');
      cy.get('[data-cy=login-button]').click();
      cy.url().should('include', '/dashboard');
    });

    it('should logout successfully', () => {
      cy.get('[data-cy=user-menu]').click();
      cy.get('[data-cy=logout-button]').click();

      // Should redirect to login page
      cy.url().should('include', '/auth/login');
      
      // Should not be able to access protected routes
      cy.visit('/dashboard');
      cy.url().should('include', '/auth/login');
    });

    it('should clear authentication state after logout', () => {
      cy.get('[data-cy=user-menu]').click();
      cy.get('[data-cy=logout-button]').click();

      // Check that localStorage is cleared
      cy.window().then((window) => {
        expect(window.localStorage.getItem('access_token')).to.be.null;
        expect(window.localStorage.getItem('current_user')).to.be.null;
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading spinner during login', () => {
      cy.visit('/auth/login');
      
      // Intercept the login API call to add delay
      cy.intercept('POST', '/api/auth/login', { delay: 1000 }).as('loginRequest');

      cy.get('[data-cy=email-input]').type('demo@concepter.com');
      cy.get('[data-cy=password-input]').type('demo123');
      cy.get('[data-cy=login-button]').click();

      // Should show loading spinner
      cy.get('[data-cy=loading-spinner]').should('be.visible');
      
      cy.wait('@loginRequest');
      
      // Loading spinner should disappear
      cy.get('[data-cy=loading-spinner]').should('not.exist');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', () => {
      cy.visit('/auth/login');
      
      // Simulate network error
      cy.intercept('POST', '/api/auth/login', { forceNetworkError: true }).as('loginError');

      cy.get('[data-cy=email-input]').type('demo@concepter.com');
      cy.get('[data-cy=password-input]').type('demo123');
      cy.get('[data-cy=login-button]').click();

      // Should show error message
      cy.get('[data-cy=error-message]').should('be.visible');
      cy.get('[data-cy=error-message]').should('contain', 'Network error');
    });

    it('should handle server errors gracefully', () => {
      cy.visit('/auth/login');
      
      // Simulate server error
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 500,
        body: { message: 'Internal server error' }
      }).as('serverError');

      cy.get('[data-cy=email-input]').type('demo@concepter.com');
      cy.get('[data-cy=password-input]').type('demo123');
      cy.get('[data-cy=login-button]').click();

      // Should show error message
      cy.get('[data-cy=error-message]').should('be.visible');
      cy.get('[data-cy=error-message]').should('contain', 'server error');
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard navigable', () => {
      cy.visit('/auth/login');
      
      // Tab through form elements
      cy.get('body').type('{tab}');
      cy.focused().should('have.attr', 'formControlName', 'email');
      
      cy.focused().type('{tab}');
      cy.focused().should('have.attr', 'formControlName', 'password');
      
      cy.focused().type('{tab}');
      cy.focused().should('have.attr', 'type', 'submit');
    });

    it('should have proper ARIA labels', () => {
      cy.visit('/auth/login');
      
      cy.get('[data-cy=email-input]').should('have.attr', 'aria-label');
      cy.get('[data-cy=password-input]').should('have.attr', 'aria-label');
      cy.get('[data-cy=login-button]').should('have.attr', 'aria-label');
    });
  });
}); 