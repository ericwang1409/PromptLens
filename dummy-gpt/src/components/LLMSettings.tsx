'use client';

import { useState } from 'react';

interface LLMSettingsProps {
  onSettingsChange: (settings: {
    provider: 'anthropic'; // Only Anthropic for now
    // provider: 'openai' | 'anthropic' | 'xai'; // Commented out other providers
    // apiKey: string; // Removed - now using environment variable
    userId: string;
    temperature: number;
    maxTokens: number;
    model: string;
  }) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function LLMSettings({ onSettingsChange, isOpen, onClose }: LLMSettingsProps) {
  const [provider] = useState<'anthropic'>('anthropic'); // Only Anthropic, no state needed
  // const [provider, setProvider] = useState<'openai' | 'anthropic' | 'xai'>('openai'); // Commented out
  // const [apiKey, setApiKey] = useState(''); // Removed - using environment variable
  const [userId, setUserId] = useState('default-user');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1000);
  const [model, setModel] = useState('claude-3-haiku-20240307'); // Default Anthropic model

  const handleSave = () => {
    onSettingsChange({
      provider,
      // apiKey, // Removed - using environment variable
      userId,
      temperature,
      maxTokens,
      model,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 w-full max-w-lg mx-4 shadow-2xl border border-purple-100">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Settings</h2>
        </div>
        
        <div className="space-y-4">
          {/* Provider selection commented out - only using Anthropic */}
          {/* <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Provider
            </label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as 'openai' | 'anthropic' | 'xai')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="xai">XAI (Grok)</option>
            </select>
          </div> */}
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Provider
            </label>
            <div className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 font-medium">
              🤖 Anthropic (Claude) - Only provider available
            </div>
          </div>

          {/* API Key input removed - now using environment variable */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-lg flex items-center justify-center">
                  <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-semibold text-blue-800">
                  🔑 API Key Configuration
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>Using environment variable: <code className="bg-blue-100 px-2 py-1 rounded-lg font-mono text-xs">ANTHROPIC_API_KEY</code></p>
                  <p className="mt-2">Set this in your <code className="bg-blue-100 px-2 py-1 rounded-lg font-mono text-xs">.env.local</code> file</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              👤 User ID
            </label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Enter user ID"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              🧠 Model (optional)
            </label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="Leave empty for default model"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                🌡️ Temperature: {temperature}
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📝 Max Tokens
              </label>
              <input
                type="number"
                min="1"
                max="8000"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4 mt-8">
          <button
            onClick={onClose}
            className="px-6 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all duration-200 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            💾 Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
