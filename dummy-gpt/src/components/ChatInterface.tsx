'use client';

import { useState, useRef, useEffect } from 'react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import LLMSettings from './LLMSettings';
import { Message } from '@/types/chat';

interface LLMSettings {
  provider: 'anthropic'; // Only Anthropic for now
  // provider: 'openai' | 'anthropic' | 'xai'; // Commented out other providers
  // apiKey: string; // Removed - now using environment variable
  userId: string;
  temperature: number;
  maxTokens: number;
  model: string;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [llmSettings, setLlmSettings] = useState<LLMSettings>({
    provider: 'anthropic', // Default to Anthropic
    // apiKey: '', // Removed - now using environment variable
    userId: 'default-user',
    temperature: 0.7,
    maxTokens: 1000,
    model: 'claude-3-haiku-20240307', // Default Anthropic model
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    console.log('🚀 handleSendMessage called with:', content);
    
    // No API key check needed - using environment variable

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const requestBody = {
        message: content,
        provider: llmSettings.provider,
        // apiKey: llmSettings.apiKey, // Removed - using environment variable
        userId: llmSettings.userId,
        temperature: llmSettings.temperature,
        maxTokens: llmSettings.maxTokens,
        model: llmSettings.model || undefined,
      };
      
      console.log('📤 Sending request to /api/chat with body:', requestBody);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.log('❌ Error data:', errorData);
        throw new Error(errorData.error || 'Failed to get response');
      }

      const data = await response.json();
      console.log('✅ Response data:', data);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        role: 'assistant',
        timestamp: new Date(),
        provider: data.provider,
        model: data.model,
        usage: data.usage,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('💥 Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please check your settings and try again.`,
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  const handleSettingsChange = (settings: LLMSettings) => {
    setLlmSettings(settings);
  };

  return (
    <div className="flex-1 flex flex-col bg-white/60 backdrop-blur-sm">
      <div className="flex-1 overflow-hidden">
        <MessageList messages={messages} isLoading={isLoading} />
        <div ref={messagesEndRef} />
      </div>
      <div className="border-t border-purple-100 bg-white/80 backdrop-blur-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-600">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-green-100 to-emerald-100 text-green-700">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Ready to chat with {llmSettings.provider.toUpperCase()}
              {llmSettings.model && ` (${llmSettings.model})`}
            </span>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="text-sm text-purple-600 hover:text-purple-800 px-3 py-2 rounded-lg hover:bg-purple-50 transition-all duration-200 font-medium"
          >
            ⚙️ Settings
          </button>
        </div>
        <MessageInput onSendMessage={handleSendMessage} disabled={isLoading} />
        {messages.length > 0 && (
          <div className="mt-4 flex justify-center">
            <button
              onClick={handleClearChat}
              className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100 transition-all duration-200 font-medium"
            >
              🗑️ Clear conversation
            </button>
          </div>
        )}
      </div>
      
      <LLMSettings
        onSettingsChange={handleSettingsChange}
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
}
