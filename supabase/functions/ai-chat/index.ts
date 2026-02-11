// AI Chat Edge Function for UniMates
// This function provides AI-powered chat assistance for students

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface ChatRequest {
  message: string
  conversationId?: string
  context?: {
    teamId?: string
    userId?: string
    subject?: string
    topic?: string
  }
}

interface ChatResponse {
  response: string
  conversationId: string
  timestamp: string
  suggestions?: string[]
}

// Initialize Supabase client
const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? '',
  {
    global: {
      headers: { Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` },
    },
  }
)

// Mock AI response function (replace with actual AI API integration)
async function getAIResponse(messages: ChatMessage[], context?: any): Promise<string> {
  // This is a mock implementation. In production, you would:
  // 1. Use OpenAI API, Anthropic Claude, or another AI service
  // 2. Set up API keys in environment variables
  // 3. Implement proper error handling and rate limiting
  
  const lastMessage = messages[messages.length - 1]?.content || '';
  
  // Mock responses based on context and message content
  if (lastMessage.toLowerCase().includes('hello') || lastMessage.toLowerCase().includes('hi')) {
    return "Hello! I'm your UniMates AI assistant. I can help you with study questions, team collaboration tips, and academic resources. What would you like to know?";
  }
  
  if (lastMessage.toLowerCase().includes('study') || lastMessage.toLowerCase().includes('learn')) {
    return "I can help you with study strategies! Here are some tips:\n1. Try the Pomodoro technique (25 min study, 5 min break)\n2. Use active recall by testing yourself\n3. Teach concepts to your teammates\n4. Create mind maps for complex topics\n\nWhat specific subject are you studying?";
  }
  
  if (lastMessage.toLowerCase().includes('team') || lastMessage.toLowerCase().includes('collaborat')) {
    return "Team collaboration is key! Here are some suggestions:\n1. Schedule regular study sessions with your team\n2. Use peer explanations to reinforce learning\n3. Try collaborative problem-solving activities\n4. Give constructive feedback to teammates\n\nWould you like help setting up a team activity?";
  }
  
  if (lastMessage.toLowerCase().includes('mission') || lastMessage.toLowerCase().includes('progress')) {
    return "Missions help your team level up! To complete missions:\n1. Participate in different interaction types (peer explanations, collaborative editing, study sessions)\n2. Make sure at least 3 team members contribute\n3. Complete the required interactions each week\n4. Verify your interactions to record progress\n\nCheck your team dashboard for current mission status!";
  }
  
  if (lastMessage.toLowerCase().includes('help') || lastMessage.toLowerCase().includes('confused')) {
    return "I'm here to help! You can ask me about:\n- Study techniques and resources\n- Team collaboration strategies\n- Mission completion tips\n- Academic support\n- Time management\n\nWhat specific area do you need help with?";
  }
  
  // Default response
  return `I understand you're asking about: "${lastMessage}". As your UniMates AI assistant, I'm here to support your learning journey. Could you provide more details about what you need help with? I can assist with study strategies, team collaboration, mission completion, and academic resources.`;
}

// Generate conversation suggestions
function generateSuggestions(context?: any): string[] {
  const suggestions = [
    "How can I improve my study habits?",
    "What are good team collaboration activities?",
    "How do missions work in UniMates?",
    "Can you explain peer explanation activities?",
    "What's the best way to prepare for exams?",
    "How do I verify team interactions?",
  ];
  
  // Context-aware suggestions
  if (context?.subject) {
    suggestions.unshift(`Can you help me with ${context.subject}?`);
  }
  
  if (context?.teamId) {
    suggestions.unshift("How can my team complete this week's mission?");
  }
  
  return suggestions.slice(0, 5); // Return top 5 suggestions
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message, conversationId, context }: ChatRequest = await req.json()
    
    if (!message || message.trim() === '') {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get user from authorization header
    const authHeader = req.headers.get('Authorization')
    let userId = context?.userId
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user }, error } = await supabaseClient.auth.getUser(token)
      
      if (!error && user) {
        userId = user.id
      }
    }

    // Generate conversation ID if not provided
    const convId = conversationId || crypto.randomUUID()
    
    // Get conversation history from database if conversationId is provided
    let conversationHistory: ChatMessage[] = []
    
    if (conversationId && userId) {
      const { data: history, error } = await supabaseClient
        .from('ai_conversations')
        .select('messages')
        .eq('id', conversationId)
        .eq('user_id', userId)
        .single()
      
      if (!error && history?.messages) {
        conversationHistory = history.messages
      }
    }

    // Add user message to history
    conversationHistory.push({ role: 'user', content: message })
    
    // Get AI response
    const aiResponse = await getAIResponse(conversationHistory, context)
    
    // Add AI response to history
    conversationHistory.push({ role: 'assistant', content: aiResponse })
    
    // Store conversation in database if user is authenticated
    if (userId) {
      await supabaseClient
        .from('ai_conversations')
        .upsert({
          id: convId,
          user_id: userId,
          team_id: context?.teamId,
          messages: conversationHistory,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id'
        })
    }

    // Generate suggestions
    const suggestions = generateSuggestions(context)
    
    const response: ChatResponse = {
      response: aiResponse,
      conversationId: convId,
      timestamp: new Date().toISOString(),
      suggestions,
    }

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in AI chat function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})