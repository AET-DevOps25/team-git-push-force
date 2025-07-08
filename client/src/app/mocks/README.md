# Mock API System

This mock system provides realistic API simulation for development and testing without requiring a backend server.

## 🚀 Quick Start

The mock system is **automatically enabled** when `environment.useMockApi` is `true`. No additional setup required!

### Default Test Accounts

| Email | Password | Role |
|-------|----------|------|
| `demo@concepter.com` | `demo123` | Demo User |
| `john.doe@example.com` | `password123` | Tech Professional |
| `alice.smith@company.com` | `securepass456` | Healthcare Manager |

## 📊 Mock Data Overview

### Users (3 users)
- Complete user profiles with preferences
- Different industries and event format preferences
- Realistic activity timestamps

### Concepts (4 concepts)
- **AI Innovation Summit 2024** - In Progress (500 attendees, hybrid)
- **Sustainable Business Workshop** - Draft (150 attendees, physical)
- **Digital Marketing Masterclass** - Completed (1000 attendees, virtual)
- **Product Management Bootcamp** - Archived (80 attendees, hybrid)

### Documents (6 documents)
- Various file types: PDF, DOCX, TXT
- Different processing statuses: COMPLETED, PROCESSING, FAILED
- Document categories: Guidelines, Industry Reports, Brand Decks, Past Event Debriefs

### Chat Messages
- Pre-built conversation history for AI Summit concept
- Smart response generation based on message content
- Realistic AI suggestions and follow-up questions

## ⚙️ Configuration

### Environment Settings

```typescript
// src/environments/environment.ts
export const environment = {
  useMockApi: true,           // Enable/disable mock API
  mockDelay: 800,             // Response delay in ms
  mockApiConfig: {
    networkDelay: true,       // Simulate network delays
    simulateErrors: false,    // Occasionally return errors
    errorRate: 0.1,          // Error rate when enabled
    autoLogin: true,         // Auto-login on app start
    defaultUser: 'demo@concepter.com',
    verboseLogging: true     // Detailed console logging
  }
};
```

### Two Mock Implementations

1. **MockHttpInterceptor** (Default) - Intercepts HTTP calls
2. **MockApiService** - Direct service injection for unit tests

## 🔧 Usage Examples

### Authentication
```typescript
// All standard auth flows work
authService.login('demo@concepter.com', 'demo123')
  .subscribe(response => {
    console.log('Logged in:', response.user);
  });
```

### Concepts
```typescript
// Create new concept
const conceptData = {
  title: 'My Event',
  description: 'Event description',
  tags: ['conference', 'tech']
};

conceptService.createConcept(conceptData)
  .subscribe(concept => {
    console.log('Created:', concept);
  });

// Get all concepts
conceptService.getConcepts()
  .subscribe(concepts => {
    console.log('User concepts:', concepts);
  });
```

### Chat
```typescript
// Send chat message
const chatRequest = {
  message: 'Help me plan a tech conference',
  conceptId: 'concept-1'
};

chatService.sendMessage(chatRequest)
  .subscribe(response => {
    console.log('AI Response:', response.response);
    console.log('Suggestions:', response.suggestions);
  });
```

### Documents
```typescript
// Upload document
const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });

documentService.upload(file)
  .subscribe(result => {
    console.log('Upload result:', result);
  });
```

## 🎯 Smart AI Responses

The mock chat system provides intelligent responses based on message content:

- **AI/Tech Conference questions** → Conference planning suggestions
- **Speaker requests** → Speaker recommendations and outreach tips  
- **General questions** → Structured event planning guidance

### Example Conversations

```typescript
// User: "I want to create a tech conference for 300 people"
// AI: Provides format suggestions, track organization, timeline recommendations

// User: "Can you suggest keynote speakers?"
// AI: Lists industry leaders, implementation experts, outreach timelines

// User: "Help with sustainability workshop"
// AI: Practical workshop structure, sustainability frameworks, assessment tools
```

## 🧪 Testing Features

### Data Persistence
- All changes persist during the browser session
- Create/update/delete operations affect mock data
- Realistic version tracking and timestamps

### Error Simulation
```typescript
// Enable in environment
mockApiConfig: {
  simulateErrors: true,
  errorRate: 0.1  // 10% of requests will fail
}
```

### Network Delays
- Configurable response delays (800ms default)
- Simulates real network conditions
- Can be disabled for faster testing

## 🔍 Debugging

### Console Logging
When `verboseLogging` is enabled, you'll see:
```
🚀 Mock API intercepted: POST /auth/login
✅ Mock API response: 200 { user: {...} }
```

### Mock State Inspection
```typescript
// Check current mock state (only with MockApiService)
const state = mockApiService.getMockState();
console.log('Current user:', state.currentUser);
console.log('Concepts count:', state.conceptsCount);
```

## 📁 File Structure

```
src/app/mocks/
├── data/
│   ├── mock-users.ts          # User accounts and credentials
│   ├── mock-concepts.ts       # Event concepts with full details
│   ├── mock-chat.ts          # Chat messages and AI responses  
│   ├── mock-documents.ts     # Document upload simulation
│   └── index.ts              # Data exports
├── services/
│   ├── mock-http.interceptor.ts   # HTTP interception
│   ├── mock-api.service.ts        # Direct service alternative
│   └── index.ts                   # Service exports
├── index.ts                   # Main exports
└── README.md                  # This file
```

## 🔄 Switching to Real API

To switch to a real backend:

1. Set `environment.useMockApi = false`
2. Update `environment.apiUrl` to your backend URL
3. The app will use real HTTP calls instead of mock data

```typescript
// src/environments/environment.prod.ts
export const environment = {
  production: true,
  useMockApi: false,           // Disable mocks
  apiUrl: 'https://api.yourbackend.com'
};
```

## 💡 Best Practices

1. **Development**: Use mocks for rapid UI development
2. **Testing**: MockApiService for unit tests, interceptor for integration
3. **Demos**: Enable auto-login for smooth demonstrations  
4. **Debugging**: Use verbose logging to trace API interactions
5. **Performance**: Reduce mockDelay for faster development cycles

## 🆘 Troubleshooting

### Mock API not working?
- Check `environment.useMockApi` is `true`
- Verify interceptor is registered in `app.config.ts`
- Look for console errors in developer tools

### Authentication issues?
- Use provided test credentials
- Check network tab for actual HTTP requests
- Verify token storage in browser developer tools

### Missing data?
- Mock data resets on browser refresh
- Use provided helper functions to seed test data
- Check console for mock state information

---

**Ready to build amazing event concepts!** 🎉 