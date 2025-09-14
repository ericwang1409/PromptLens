'use client';

import { Message } from '@/types/chat';
import MessageBubble from './MessageBubble';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
}

export default function MessageList({ messages, isLoading }: MessageListProps) {
  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center shadow-lg">
            <svg className="w-10 h-10 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-3">Start a conversation</h3>
          <p className="text-gray-600 text-lg">Ask me anything and I&apos;ll do my best to help!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      {isLoading && (
        <div className="flex justify-start mb-6">
          <div className="bg-white rounded-2xl p-5 max-w-xs shadow-lg border border-gray-100">
            <div className="flex space-x-2">
              <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
