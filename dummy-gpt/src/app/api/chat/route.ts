import { NextRequest, NextResponse } from 'next/server';
import { ChatRequest, ChatResponse } from '@/types/chat';

// Configuration for your FastAPI backend
const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL || "https://prompt-lens-c4218b9ba45e.herokuapp.com";
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Chat API called');
    const body: ChatRequest = await request.json();
    console.log('📝 Request body:', body);
    
    const { message, userId, temperature, maxTokens, model } = body;
    // const { message, provider, apiKey, userId, temperature, maxTokens, model } = body; // Commented out provider and apiKey since we use env vars

    if (!message || typeof message !== 'string') {
      console.log('❌ Message validation failed');
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    if (!ANTHROPIC_API_KEY) {
      console.log('❌ Anthropic API key not configured');
      return NextResponse.json(
        { error: 'Anthropic API key not configured. Please set ANTHROPIC_API_KEY environment variable.' },
        { status: 500 }
      );
    }

    console.log('🌐 Making request to FastAPI backend...');
    console.log('🔗 URL:', `${FASTAPI_BASE_URL}/api/generate`);

    // Call your FastAPI backend
    const fastApiResponse = await fetch(`${FASTAPI_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: message,
        provider: 'anthropic', // Only use Anthropic
        user_id: userId || 'default-user',
        api_key: ANTHROPIC_API_KEY, // Use environment variable
        temperature: temperature || 0.7,
        max_tokens: maxTokens || 1000,
        model: model || 'claude-3-haiku-20240307', // Default Anthropic model
      }),
    });

    console.log('📡 FastAPI response status:', fastApiResponse.status);

    if (!fastApiResponse.ok) {
      const errorData = await fastApiResponse.json().catch(() => ({}));
      console.log('❌ FastAPI error:', errorData);
      
      // If it's an API key error, return a mock response instead
      if (errorData.detail && errorData.detail.includes('API key')) {
        console.log('🔑 API key error detected, returning mock response');
        const mockResponse: ChatResponse = {
          response: `Mock response: I received your message "${message}". This is a test response since no valid API key was provided. The FastAPI backend is working correctly!`,
          provider: 'anthropic',
          model: 'claude-3-haiku-20240307',
          usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
        };
        return NextResponse.json(mockResponse);
      }
      
      return NextResponse.json(
        { 
          error: `FastAPI error: ${errorData.detail || fastApiResponse.statusText}` 
        },
        { status: fastApiResponse.status }
      );
    }

    const fastApiData = await fastApiResponse.json();
    console.log('✅ FastAPI response data:', fastApiData);

    const response: ChatResponse = {
      response: fastApiData.generated_text,
      provider: fastApiData.provider,
      model: fastApiData.model_used,
      usage: fastApiData.usage,
    };

    console.log('🎉 Sending response to client:', response);
    return NextResponse.json(response);
  } catch (error) {
    console.error('💥 Error in chat API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
