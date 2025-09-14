# 🚀 **PromptLens - AI Analytics & Chat Platform**

## **What It Does**

**PromptLens** is a comprehensive AI-powered analytics and chat platform that helps organizations understand, analyze, and optimize their AI interactions. It's essentially a "business intelligence tool for AI conversations" that provides deep insights into how people interact with AI systems.

## **Core Functionality**

### 🧠 **1. AI Chat Analytics**
- **Conversation Tracking**: Records all AI prompts and responses with full metadata
- **Vector Similarity Search**: Uses embeddings to find similar conversations and responses
- **Smart Caching**: Reuses similar responses to reduce API costs and improve response times
- **Multi-LLM Support**: Works with OpenAI, Anthropic Claude, and XAI (Grok) models

### 📊 **2. Natural Language Data Visualization**
- **Query in Plain English**: Ask questions like "Show me daily prompt volume trends" or "What are the most common user questions?"
- **Automatic Chart Generation**: Converts natural language queries into interactive charts (line, bar, pie charts)
- **Time Series Analysis**: Supports different granularities (daily, hourly, 30-minute, 15-minute intervals)
- **Real-time Insights**: Provides instant visualizations of your AI usage patterns

### 🔍 **3. Advanced Analytics Dashboard**
- **Usage Metrics**: Track prompts, responses, users, and engagement over time
- **Performance Monitoring**: Response times, token usage, and model performance
- **User Behavior Analysis**: Understand how different users interact with AI
- **Cost Optimization**: Identify opportunities to reduce API costs through caching

### �� **4. Chat Interface (ClueLEE)**
- **Modern Chat UI**: Clean, ChatGPT-like interface for direct AI conversations
- **Multi-Provider Support**: Switch between different AI models seamlessly
- **Conversation History**: Save and manage chat sessions
- **Real-time Responses**: Fast, streaming responses from AI models

## **Why It's Useful**

### �� **For Organizations**
- **Cost Optimization**: Reduce AI API costs by 30-50% through intelligent caching
- **Quality Assurance**: Monitor AI response quality and consistency
- **Usage Insights**: Understand which AI features are most valuable
- **Performance Monitoring**: Track response times and identify bottlenecks

### �� **For Data Teams**
- **AI Analytics**: Get detailed insights into AI usage patterns
- **Custom Visualizations**: Create charts and dashboards from natural language queries
- **Data Export**: Export conversation data for further analysis
- **A/B Testing**: Compare different AI models and prompts

### 👥 **For End Users**
- **Better AI Experience**: Faster responses through caching
- **Conversation History**: Never lose important AI conversations
- **Multi-Model Access**: Use the best AI model for each task
- **Intuitive Interface**: Natural language queries for complex analytics

## **How It Was Built**

### 🏗️ **Architecture Overview**

**PromptLens** uses a modern, scalable architecture with three main components:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   (Next.js)     │◄──►│   (FastAPI)     │◄──►│   (Supabase)    │
│                 │    │                 │    │                 │
│ • Dashboard     │    │ • LLM Services  │    │ • PostgreSQL   │
│ • Chat UI       │    │ • Vector Search │    │ • Vector DB    │
│ • Analytics     │    │ • Caching       │    │ • Auth         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 🛠️ **Technology Stack**

#### **Frontend (Next.js 14)**
- **Framework**: Next.js with App Router
- **Styling**: Tailwind CSS + shadcn/ui components
- **Charts**: Recharts for data visualization
- **State Management**: React hooks and context
- **Authentication**: Supabase Auth

#### **Backend (FastAPI)**
- **Framework**: FastAPI with async/await
- **LLM Integration**: OpenAI, Anthropic, XAI APIs
- **Vector Search**: OpenAI embeddings + cosine similarity
- **Caching**: Intelligent response caching system
- **Authentication**: JWT + API key management

#### **Database (Supabase)**
- **Primary DB**: PostgreSQL with vector extensions
- **Vector Storage**: pgvector for similarity search
- **Authentication**: Built-in user management
- **Real-time**: WebSocket subscriptions for live updates

### 🔧 **Key Technical Features**

#### **1. Vector Similarity Search**
```python
# Uses OpenAI embeddings to find similar conversations
embedding = await openai.embeddings.create(
    model="text-embedding-3-small",
    input=prompt
)
```

#### **2. Intelligent Caching**
- **Semantic Matching**: Finds similar prompts using vector similarity
- **Cost Reduction**: Reuses responses for similar queries
- **Quality Control**: Only caches high-quality responses

#### **3. Natural Language Query Processing**
```typescript
// Converts "Show me daily trends" into structured data
const agent = new Agent({
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_KEY
});
const result = await agent.run("Show me daily trends");
```

#### **4. Multi-LLM Support**
- **Unified Interface**: Same API for all AI providers
- **Model Selection**: Choose the best model for each task
- **Fallback Handling**: Graceful degradation if models fail

### 📈 **Scalability & Performance**

- **Horizontal Scaling**: Stateless FastAPI backend
- **Database Optimization**: Indexed vector searches
- **Caching Strategy**: Multi-layer caching (memory + database)
- **CDN Integration**: Static assets served via CDN
- **Real-time Updates**: WebSocket connections for live data

### 🔐 **Security & Privacy**

- **API Key Management**: Secure storage of LLM API keys
- **User Authentication**: Supabase Auth with JWT tokens
- **Data Encryption**: All data encrypted in transit and at rest
- **Access Control**: Role-based permissions for different user types

## **Deployment**

- **Frontend**: Deployed on Vercel (Next.js)
- **Backend**: Deployed on Heroku (FastAPI)
- **Database**: Supabase (managed PostgreSQL)
- **Monitoring**: Built-in logging and error tracking

This architecture makes PromptLens a powerful, scalable platform for AI analytics that can grow with organizations while providing immediate value through cost savings and insights.
