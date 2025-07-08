export const environment = {
  production: false,
  useMockApi: true,
  apiUrl: 'http://localhost:8080',
  mockDelay: 800,
  enableLogging: true,
  
  // Mock API specific settings
  mockApiConfig: {
    // Simulate network delays
    networkDelay: true,
    
    // Simulate occasional errors for testing
    simulateErrors: false,
    errorRate: 0.1, // 10% error rate when enabled
    
    // Auto-login for development
    autoLogin: true,
    defaultUser: 'demo@concepter.com',
    
    // Enable detailed logging
    verboseLogging: true
  }
}; 