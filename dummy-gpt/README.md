# ClueLEE - AI Chatbot

A modern AI chatbot interface built with Next.js, Tailwind CSS, and shadcn/ui components. This app connects to your FastAPI backend to provide intelligent conversations powered by Anthropic's Claude AI.

## Features

- 🤖 **Anthropic Claude Integration** - Powered by Claude AI via your FastAPI backend
- 💬 **Real-time Chat Interface** - Clean, modern chat UI similar to ChatGPT
- 🎨 **Modern Design** - Built with shadcn/ui components and Tailwind CSS
- 🔐 **Secure API Integration** - Uses environment variables for API keys
- 📱 **Responsive Design** - Works on desktop and mobile devices

## Getting Started

### 1. Environment Setup

Create a `.env.local` file in the root directory with the following variables:

```env
# Anthropic API Configuration
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# PromptLens API Configuration  
PROMPTLENS_API_KEY=your_promptlens_api_key_here

# FastAPI Backend Configuration
FASTAPI_BASE_URL=https://prompt-lens-c4218b9ba45e.herokuapp.com
```

### 2. Get Your API Keys

- **Anthropic API Key**: Get from [console.anthropic.com](https://console.anthropic.com/)
- **PromptLens API Key**: Get from your PromptLens account dashboard

### 3. Install Dependencies

```bash
npm install
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
