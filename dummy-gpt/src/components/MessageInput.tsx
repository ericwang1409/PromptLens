'use client';

import { useState, KeyboardEvent } from 'react';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  disabled: boolean;
}

export default function MessageInput({ onSendMessage, disabled }: MessageInputProps) {
  const [message, setMessage] = useState('');

  const handleSubmit = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex items-end space-x-4">
      <div className="flex-1">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask me anything..."
          disabled={disabled}
          className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 placeholder-gray-400 shadow-sm transition-all duration-200"
          rows={1}
          style={{ minHeight: '56px', maxHeight: '120px' }}
        />
      </div>
      <button
        onClick={handleSubmit}
        disabled={!message.trim() || disabled}
        className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
      >
        {disabled ? (
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <div className="flex items-center space-x-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            <span className="font-semibold">Send</span>
          </div>
        )}
      </button>
    </div>
  );
}
