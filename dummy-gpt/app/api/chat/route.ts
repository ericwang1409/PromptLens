import { NextRequest, NextResponse } from 'next/server';

// Configuration for your FastAPI backend
const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL || "https://prompt-lens-c4218b9ba45e.herokuapp.com";
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const PROMPTLENS_API_KEY = process.env.PROMPTLENS_API_KEY;

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Chat API called');
    const body = await request.json();
    const { message, userId = 'default-user', temperature = 0.7, maxTokens = 1000, model = 'claude-3-haiku-20240307' } = body;

    console.log('📝 Message:', message);
    console.log('👤 User ID:', userId);

    if (!message || typeof message !== 'string') {
      console.log('❌ Invalid message');
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

    if (!PROMPTLENS_API_KEY) {
      console.log('❌ PromptLens API key not configured');
      return NextResponse.json(
        { error: 'PromptLens API key not configured. Please set PROMPTLENS_API_KEY environment variable.' },
        { status: 500 }
      );
    }

    console.log('🌐 Making request to FastAPI backend...');
    console.log('🔗 URL:', `${FASTAPI_BASE_URL}/api/generate`);
    console.log('🔑 Using PromptLens API key for authentication');

    // Call your FastAPI backend
    const fastApiResponse = await fetch(`${FASTAPI_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PROMPTLENS_API_KEY}`,
      },
      body: JSON.stringify({
        prompt: message,
        provider: 'anthropic', // Only use Anthropic
        user_id: userId,
        api_key: ANTHROPIC_API_KEY, // Use environment variable
        temperature: temperature,
        max_tokens: maxTokens,
        model: model,
      }),
    });

    console.log('📡 FastAPI response status:', fastApiResponse.status);

    if (!fastApiResponse.ok) {
      const errorText = await fastApiResponse.text();
      console.log('❌ FastAPI error:', errorText);
      return NextResponse.json(
        { error: `FastAPI error: ${fastApiResponse.status} - ${errorText}` },
        { status: fastApiResponse.status }
      );
    }

    const data = await fastApiResponse.json();
    console.log('✅ FastAPI response received:', data);

    // Return the response in the format expected by the frontend
    return NextResponse.json({
      response: data.generated_text,
      provider: data.provider,
      model: data.model_used,
      usage: data.usage,
      cached: data.cached || false,
      similarity_score: data.similarity_score || null,
    });

  } catch (error) {
    console.error('💥 Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
