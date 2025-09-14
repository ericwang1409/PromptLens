# Dummy GPT - Simple LLM Chatbot

A clean and minimalistic chatbot interface built with Next.js, React, and Tailwind CSS. This app provides a ChatGPT-like interface for querying your custom LLM API.

## Features

- 🎨 Clean, minimalistic UI similar to ChatGPT
- 💬 Real-time chat interface with message history
- ⚡ Fast and responsive design
- 🔄 Loading states and error handling
- 📱 Mobile-friendly responsive design
- 🧹 Clear conversation functionality

## Getting Started

1. **Set up environment variables**:
   Create a `.env.local` file in the root directory:
   ```env
   # Anthropic API Configuration
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   
   # PromptLens API Configuration
   PROMPTLENS_API_KEY=your_promptlens_api_key_here
   
   # FastAPI Backend Configuration (optional)
   FASTAPI_BASE_URL=https://prompt-lens-c4218b9ba45e.herokuapp.com
   ```

2. **Get your API keys**:
   - **Anthropic API key**: Go to [console.anthropic.com](https://console.anthropic.com/)
     - Sign up or log in
     - Create a new API key
     - Copy the key and paste it as `ANTHROPIC_API_KEY` in your `.env.local` file
   
   - **PromptLens API key**: Get this from your PromptLens account
     - This is used to authenticate with your FastAPI backend
     - Copy the key and paste it as `PROMPTLENS_API_KEY` in your `.env.local` file

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000) in your browser**.

## Integration with FastAPI Backend

This app is already configured to work with the FastAPI backend defined in `main.py`. The integration includes:

### Features
- **Multi-Provider Support**: OpenAI, Anthropic, and XAI (Grok)
- **Configurable Settings**: API keys, temperature, max tokens, model selection
- **Real-time Status**: Shows connection status and current provider
- **Error Handling**: Graceful error handling with detailed error messages

### Setup Instructions

1. **Start your FastAPI backend**:
```bash
cd /path/to/your/api
python main.py
# or
uvicorn main:app --host 0.0.0.0 --port 8000
```

2. **Configure the backend URL** (optional):
Create a `.env.local` file in the dummy-gpt directory:
```env
FASTAPI_BASE_URL=http://localhost:8000
```

3. **Start the Next.js app**:
```bash
cd dummy-gpt
npm run dev
```

4. **Configure your LLM settings**:
   - Click the "Settings" button in the chat interface
   - Select your preferred provider (OpenAI, Anthropic, or XAI)
   - Enter your API key
   - Adjust temperature and max tokens as needed
   - Optionally specify a custom model

### API Integration Details

The app sends requests to your FastAPI backend with this structure:

```typescript
{
  message: string,
  provider: 'openai' | 'anthropic' | 'xai',
  apiKey: string,
  userId: string,
  temperature: number,
  maxTokens: number,
  model?: string
}
```

Your FastAPI backend should respond with:

```typescript
{
  generated_text: string,
  provider: string,
  model_used: string,
  usage: object,
  user_id: string
}
```

## Project Structure

```
src/
├── app/
│   ├── api/chat/route.ts    # API endpoint for chat
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Main page
├── components/
│   ├── ChatInterface.tsx    # Main chat container
│   ├── MessageBubble.tsx    # Individual message component
│   ├── MessageInput.tsx     # Input component
│   └── MessageList.tsx      # Message list container
└── types/
    └── chat.ts              # TypeScript type definitions
```

## Customization

### Styling
The app uses Tailwind CSS for styling. You can customize the appearance by modifying the classes in the component files.

### Message Format
The app expects messages in this format:
```typescript
interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}
```

### API Response Format
The API expects responses in this format:
```typescript
interface ChatResponse {
  response: string;
}
```

## Deployment

To deploy this app:

1. Build the production version:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

Or deploy to platforms like Vercel, Netlify, or any other Next.js-compatible hosting service.

## License

MIT License - feel free to use this project for your own needs!