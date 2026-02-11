# AI Chatbox Feature for UniMates

## Overview
The AI Chatbox feature provides an intelligent assistant for UniMates users, helping them with study questions, team collaboration tips, mission completion guidance, and academic resources.

## Architecture

### Backend Components
1. **Supabase Edge Function** (`supabase/functions/ai-chat/index.ts`)
   - Deno-based serverless function
   - Handles AI chat requests
   - Stores conversation history in database
   - Provides context-aware responses

2. **Database Schema** (`supabase-schema.sql`)
   - `ai_conversations` table for storing chat history
   - Row Level Security (RLS) policies for user privacy
   - Automatic cleanup of old conversations

### Frontend Components
1. **AIChatbox Component** (`src/components/AIChatbox.jsx`)
   - Floating chat interface available on all pages
   - Real-time messaging with typing indicators
   - Quick suggestion buttons
   - Conversation history management

2. **Integration** (`src/components/layout.jsx`)
   - Added to main layout for global accessibility
   - Available to both authenticated and anonymous users

## Features

### Core Features
- **Context-Aware Responses**: AI understands team context, subjects, and user preferences
- **Conversation History**: Saves chat history for authenticated users
- **Quick Suggestions**: Provides relevant conversation starters
- **Error Handling**: Graceful degradation when AI service is unavailable
- **Responsive Design**: Works on desktop and mobile devices

### User Experience
- Floating chat button in bottom-right corner
- Expandable chat window with smooth animations
- Message timestamps and visual distinction between user/AI messages
- Loading indicators and error states
- Clear conversation option

## Setup Instructions

### 1. Database Setup
Run the SQL commands in `supabase-schema.sql` to create the `ai_conversations` table and RLS policies.

### 2. Edge Function Deployment
```bash
# Deploy the AI chat function to Supabase
supabase functions deploy ai-chat
```

### 3. Environment Variables
Set the following environment variables in your Supabase dashboard:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
- `OPENAI_API_KEY`: (Optional) For future OpenAI integration

### 4. Frontend Integration
The chatbox is automatically integrated into the main layout. No additional setup required.

## API Documentation

### Endpoint
```
POST https://[your-project].supabase.co/functions/v1/ai-chat
```

### Request Body
```json
{
  "message": "How do missions work?",
  "conversationId": "optional-uuid",
  "context": {
    "teamId": "optional-team-uuid",
    "userId": "optional-user-uuid",
    "subject": "optional-subject"
  }
}
```

### Response
```json
{
  "response": "Missions help your team level up! To complete missions...",
  "conversationId": "generated-uuid",
  "timestamp": "2024-01-01T12:00:00Z",
  "suggestions": ["How can I improve my study habits?", "..."]
}
```

## Configuration

### Edge Function Config (`config.toml`)
- Rate limiting: 60 requests per minute per IP
- Maximum request size: 1MB
- Timeout: 30 seconds
- CORS enabled for all origins
- Log level: info

### Component Props
The `AIChatbox` component accepts optional props:
- `teamId`: Current team ID for context
- `subject`: Current subject for context
- `className`: Additional CSS classes

## Future Enhancements

### Phase 2: Advanced AI Integration
1. **OpenAI/Claude Integration**: Replace mock responses with real AI
2. **Study Material Analysis**: Upload and analyze study materials
3. **Personalized Learning Plans**: Create customized study schedules
4. **Team Collaboration Suggestions**: AI-powered team activity recommendations

### Phase 3: Advanced Features
1. **Voice Input/Output**: Speech-to-text and text-to-speech
2. **Multilingual Support**: Support for multiple languages
3. **File Upload**: Analyze uploaded documents and images
4. **Integration with Calendar**: Schedule study sessions
5. **Progress Tracking**: Track learning progress over time

## Testing

### Manual Testing
1. Open the application at `http://localhost:5174`
2. Click the chat button in bottom-right corner
3. Send a message and verify response
4. Test quick suggestions
5. Test error handling (disable network)
6. Test conversation clearing

### Automated Testing
```bash
# Add test scripts to package.json
npm test
```

## Security Considerations

1. **Authentication**: Optional authentication for conversation history
2. **Rate Limiting**: Prevents abuse of the AI service
3. **Input Validation**: Sanitizes user input
4. **Data Privacy**: Conversations stored per-user with RLS
5. **CORS**: Configured for secure cross-origin requests

## Performance

### Optimizations
- **Lazy Loading**: Chatbox loads only when needed
- **Debounced Input**: Reduces unnecessary API calls
- **Caching**: Conversation history caching
- **Compression**: Response compression for large conversations

### Monitoring
- API response times
- Error rates
- User engagement metrics
- Conversation quality feedback

## Troubleshooting

### Common Issues

1. **Chatbox not appearing**
   - Check if `AIChatbox` is imported in `layout.jsx`
   - Verify no JavaScript errors in console

2. **No response from AI**
   - Check network connectivity
   - Verify Supabase function is deployed
   - Check browser console for API errors

3. **Conversation not saving**
   - Verify user is authenticated
   - Check RLS policies in database
   - Verify `ai_conversations` table exists

4. **Slow responses**
   - Check network latency
   - Verify rate limiting settings
   - Monitor Supabase function logs

## Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

### Code Standards
- Follow existing React patterns
- Use TypeScript for new components
- Add comments for complex logic
- Update documentation for API changes

## License
This feature is part of the UniMates project. See main project LICENSE for details.