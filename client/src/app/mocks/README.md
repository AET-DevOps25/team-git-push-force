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
  enableLogging: true
};
```

### Implementation

The mock system uses **direct service injection** approach:

- **ApiService** checks `environment.useMockApi` and routes to `MockApiService` when enabled
- **MockApiService** provides all mock functionality with realistic data and behavior
- Production uses real HTTP calls with AuthInterceptor and ErrorInterceptor

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

### Network Delays
- Configurable response delays (800ms default)
- Simulates real network conditions
- Can be disabled by setting `mockDelay: 0`

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
│   ├── mock-api.service.ts        # Primary mock implementation
│   └── index.ts                   # Service exports
├── index.ts                   # Main exports
└── README.md                  # This file
```

## 🔄 Switching to Real API

To switch to a real backend:

1. Set `environment.useMockApi = false`
2. Update `environment.apiUrl` to your backend URL
3. The app will use real HTTP calls with proper interceptors

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
2. **Testing**: Direct service injection provides predictable behavior
3. **Performance**: Reduce mockDelay for faster development cycles
4. **Debugging**: Clear service boundaries make issues easier to trace

## 🆘 Troubleshooting

### Mock API not working?
- Check `environment.useMockApi` is `true`
- Verify ApiService is routing to MockApiService
- Look for console errors in developer tools

### Authentication issues?
- Use provided test credentials exactly as listed
- Mock tokens start with 'mock-token-' and never expire
- Check localStorage for stored auth data

### Missing data?
- Mock data resets on browser refresh
- All operations are in-memory only during session
- Changes persist only within the current browser session

## 🚧 Known Limitations

- Mock data is session-only (resets on refresh)
- No persistent storage simulation

---

**Ready to build amazing event concepts!** 🎉 