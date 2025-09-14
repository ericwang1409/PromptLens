import ChatInterface from '@/components/ChatInterface';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
      <div className="max-w-4xl mx-auto h-screen flex flex-col">
        <header className="bg-white/80 backdrop-blur-sm border-b border-purple-100 px-6 py-6 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                ClueLEE
              </h1>
              <p className="text-sm text-gray-600 font-medium">Your intelligent AI assistant</p>
            </div>
          </div>
        </header>
        <ChatInterface />
      </div>
    </main>
  );
}