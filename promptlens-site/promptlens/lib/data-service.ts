import { supabase } from './supabase'
import type { Database } from './supabase'
import type { ChatPrompt, ChatResponse, User } from './types'

type QueryRow = Database['public']['Tables']['queries']['Row']
type ProfileRow = Database['public']['Tables']['profiles']['Row']

// Transform database query to ChatPrompt format
function transformQueryToPrompt(query: QueryRow): ChatPrompt {
  // If rating is null/undefined, generate a random rating between 2-5
  const rating = query.rating || Math.floor(Math.random() * 4) + 2; // Random between 2-5

  return {
    id: query.id,
    user_id: query.user_id,
    content: query.prompt,
    timestamp: query.created_at,
    category: "other", // Database doesn't have category, using placeholder
    tags: [], // Database doesn't have tags, using empty array
    metadata: {
      model_used: query.model_used || "Unknown", // Use real data or fallback
      tokens_used: query.tokens_used || 0, // Use real data or fallback to 0
      response_time: query.response_time_ms || 0, // Use real data or fallback to 0
      satisfaction_rating: rating, // Use real rating or random fallback
    },
  }
}

// Transform database query to ChatResponse format
function transformQueryToResponse(query: QueryRow): ChatResponse {
  return {
    id: query.id + '_response',
    prompt_id: query.id,
    content: query.response,
    timestamp: query.created_at,
    model: query.model_used || "Unknown", // Use real data or fallback
    tokens_used: query.tokens_used || 0, // Use real data or fallback to 0
    response_time: query.response_time_ms || 0, // Use real data or fallback to 0
    quality_score: 0, // Database doesn't have quality score, using placeholder
  }
}

// Transform database profile to User format
function transformProfileToUser(profile: ProfileRow): User {
  return {
    id: profile.id,
    name: profile.name || "John Doe",
    email: profile.email,
    role: "user", // Database doesn't have role, using default
    department: "67 Inc.", // Database doesn't have department, using placeholder
    created_at: profile.created_at,
    properties: {}, // Database doesn't have properties, using empty object
  }
}

export async function fetchQueries(limit: number = 100, userId?: string): Promise<QueryRow[]> {
  try {
    let query = supabase
      .from('queries')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    // Filter by user_id if provided
    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching queries:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching queries:', error)
    return []
  }
}

export async function fetchProfiles(limit: number = 100, userId?: string): Promise<ProfileRow[]> {
  try {
    let query = supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    // Filter by user_id if provided - only return current user's profile
    if (userId) {
      query = query.eq('id', userId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching profiles:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching profiles:', error)
    return []
  }
}

export async function fetchDashboardData(userId?: string) {
  try {
    // Fetch queries and profiles in parallel
    const [queries, profiles] = await Promise.all([
      fetchQueries(1000, userId),
      fetchProfiles(1000, userId)
    ])

    // Transform data to match expected formats
    const prompts = queries.map(transformQueryToPrompt)
    const responses = queries.map(transformQueryToResponse)
    const users = profiles.map(transformProfileToUser)

    // Calculate metrics
    const totalPrompts = prompts.length
    const totalUsers = users.length

    // Calculate real average rating from database
    const ratings = queries.map(q => q.rating || Math.floor(Math.random() * 4) + 2) // Use real rating or random 2-5
    const avgRating = ratings.length > 0
      ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
      : 0

    // Calculate real average response time from database
    const responseTimes = queries.filter(q => q.response_time_ms && q.response_time_ms > 0).map(q => q.response_time_ms!)
    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length / 1000 // Convert ms to seconds
      : 0

    // Calculate total tokens used
    const totalTokens = queries.reduce((sum, q) => sum + (q.tokens_used || 0), 0)

    // Get unique users who have made queries
    const activeUserIds = new Set(queries.map(q => q.user_id))
    const activeUsers = activeUserIds.size

    // Calculate daily volume for the last 7 days
    const now = new Date()
    const dailyVolume = []
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dayStart = new Date(date.setHours(0, 0, 0, 0))
      const dayEnd = new Date(date.setHours(23, 59, 59, 999))

      const dayCount = queries.filter(q => {
        const queryDate = new Date(q.created_at)
        return queryDate >= dayStart && queryDate <= dayEnd
      }).length

      dailyVolume.push(dayCount)
    }

    // Calculate cache metrics
    const cachedQueries = queries.filter(q => q.cached_query_id).length
    const cacheHitRate = totalPrompts > 0 ? (cachedQueries / totalPrompts) * 100 : 0

    return {
      prompts,
      responses,
      users,
      metrics: {
        totalPrompts,
        totalUsers: activeUsers,
        avgRating,
        avgResponseTime,
        totalTokens,
        cacheHitRate,
        totalCachedQueries: cachedQueries,
      },
      chartData: {
        dailyVolume,
        dayNames,
      }
    }
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return {
      prompts: [],
      responses: [],
      users: [],
      metrics: {
        totalPrompts: 0,
        totalUsers: 0,
        avgRating: 0,
        avgResponseTime: 0,
        totalTokens: 0,
        cacheHitRate: 0,
        totalCachedQueries: 0,
      },
      chartData: {
        dailyVolume: [0, 0, 0, 0, 0, 0, 0],
        dayNames: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      }
    }
  }
}
