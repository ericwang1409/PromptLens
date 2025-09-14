'use client';

import { Message } from '@/types/chat';

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const timeString = message.timestamp.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>
      <div className={`max-w-xs lg:max-w-md xl:max-w-lg ${isUser ? 'ml-12' : 'mr-12'}`}>
        <div
          className={`rounded-2xl px-5 py-4 shadow-lg ${
            isUser
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
              : 'bg-white text-gray-800 border border-gray-100'
          }`}
        >
          <div className="whitespace-pre-wrap break-words leading-relaxed">
            {message.content}
          </div>
        </div>
        <div className={`text-xs text-gray-400 mt-2 ${isUser ? 'text-right' : 'text-left'}`}>
          <div className="font-medium">{timeString}</div>
          {!isUser && (message.provider || message.model) && (
            <div className="mt-2 flex flex-wrap gap-1">
              {message.provider && (
                <span className="inline-block bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                  {message.provider.toUpperCase()}
                </span>
              )}
              {message.model && (
                <span className="inline-block bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                  {message.model}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
