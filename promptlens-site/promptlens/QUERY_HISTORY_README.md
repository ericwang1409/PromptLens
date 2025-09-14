# Query History Feature

This document describes the query history feature that allows users to save, view, and manage their query history across the PromptLens application.

## Database Schema

### query_history Table

The `query_history` table stores user query history with the following structure:

```sql
CREATE TABLE query_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  query_text TEXT NOT NULL,
  query_type VARCHAR(50) DEFAULT 'natural_language',
  chart_type VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  usage_count INTEGER DEFAULT 1,
  is_favorite BOOLEAN DEFAULT FALSE,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'
);
```

### Key Features

- **Automatic Deduplication**: If a user submits the same query text, the system updates the existing record instead of creating a duplicate
- **Usage Tracking**: Tracks how many times each query has been used
- **Favorites**: Users can mark queries as favorites for quick access
- **Tags**: Support for custom tags to categorize queries
- **Metadata**: Flexible JSONB field for storing additional query information
- **Row Level Security**: Users can only access their own query history

## API Endpoints

### GET /api/query-history
Fetch query history for a user.

**Query Parameters:**
- `userId` (required): User ID
- `limit` (optional): Number of queries to return (default: 20)
- `queryType` (optional): Filter by query type
- `favoritesOnly` (optional): Show only favorite queries

### POST /api/query-history
Save a new query to history or update existing one.

**Body:**
```json
{
  "userId": "string",
  "queryText": "string",
  "queryType": "natural_language" | "visualization" | "analysis" | "other",
  "chartType": "line" | "pie" | "bar" | "doughnut" | "scatter",
  "tags": ["string"],
  "metadata": {}
}
```

### PUT /api/query-history/[id]
Update a specific query (favorites, tags, metadata).

**Body:**
```json
{
  "userId": "string",
  "isFavorite": boolean,
  "tags": ["string"],
  "metadata": {}
}
```

### DELETE /api/query-history/[id]
Delete a query from history.

**Query Parameters:**
- `userId` (required): User ID

## Frontend Components

### Sidebar Integration

The sidebar displays recent queries with:
- Query text preview (truncated)
- Chart type badges
- Time ago formatting
- Usage count indicators
- Favorite star indicators
- Toggle between all queries and favorites only

### Dashboard Integration

The dashboard shows query history at the bottom with:
- Full query text display
- Interactive hover actions (favorite, delete)
- Chart type badges
- Usage statistics
- Click to regenerate functionality

## Data Service Functions

### fetchQueryHistory()
```typescript
fetchQueryHistory(
  userId: string,
  limit: number = 20,
  queryType?: string,
  favoritesOnly: boolean = false
): Promise<QueryHistory[]>
```

### saveQueryToHistory()
```typescript
saveQueryToHistory(
  userId: string,
  queryText: string,
  queryType: "natural_language" | "visualization" | "analysis" | "other" = "natural_language",
  chartType?: "line" | "pie" | "bar" | "doughnut" | "scatter",
  tags: string[] = [],
  metadata: Record<string, any> = {}
): Promise<QueryHistory | null>
```

### toggleQueryFavorite()
```typescript
toggleQueryFavorite(
  queryId: string,
  userId: string,
  isFavorite: boolean
): Promise<boolean>
```

### deleteQueryFromHistory()
```typescript
deleteQueryFromHistory(
  queryId: string,
  userId: string
): Promise<boolean>
```

## Usage Examples

### Saving a Query
```typescript
// When a user submits a query
const queryHistory = await saveQueryToHistory(
  user.id,
  "Show me daily prompt volume trends",
  "visualization",
  "line",
  ["analytics", "trends"],
  { source: "natural_language_interface" }
);
```

### Fetching Recent Queries
```typescript
// Get last 10 queries
const recentQueries = await fetchQueryHistory(user.id, 10);

// Get only favorite queries
const favoriteQueries = await fetchQueryHistory(user.id, 20, undefined, true);
```

### Toggling Favorites
```typescript
// Mark as favorite
await toggleQueryFavorite(queryId, user.id, true);

// Remove from favorites
await toggleQueryFavorite(queryId, user.id, false);
```

## Database Migration

To set up the query history feature, run the SQL migration:

```bash
# Apply the migration
psql -d your_database -f sql/create_query_history.sql
```

## Security

- Row Level Security (RLS) is enabled
- Users can only access their own query history
- All API endpoints require user authentication
- Input validation on all endpoints

## Performance Considerations

- Indexes on frequently queried columns (user_id, created_at, last_used_at)
- Automatic cleanup of old queries can be implemented as needed
- Pagination support for large query histories
- Efficient query patterns for common operations
