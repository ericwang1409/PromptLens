import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Please check your environment variables.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      user_api_keys: {
        Row: {
          id: string
          user_id: string
          api_key: string
          name: string
          created_at: string
          last_used_at?: string
          is_active: boolean
        }
        Insert: {
          id?: string
          user_id: string
          api_key: string
          name: string
          created_at?: string
          last_used_at?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          api_key?: string
          name?: string
          created_at?: string
          last_used_at?: string
          is_active?: boolean
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          name?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      queries: {
        Row: {
          id: string
          user_id: string
          prompt: string
          response: string
          prompt_embedding: number[]
          response_embedding: number[]
          created_at: string
          cached_query_id?: string
          model_used?: string
          tokens_used?: number
          response_time_ms?: number
          rating?: number
        }
        Insert: {
          id?: string
          user_id: string
          prompt: string
          response: string
          prompt_embedding: number[]
          response_embedding: number[]
          created_at?: string
          cached_query_id?: string
          model_used?: string
          tokens_used?: number
          response_time_ms?: number
          rating?: number
        }
        Update: {
          id?: string
          user_id?: string
          prompt?: string
          response?: string
          prompt_embedding?: number[]
          response_embedding?: number[]
          created_at?: string
          cached_query_id?: string
          model_used?: string
          tokens_used?: number
          response_time_ms?: number
          rating?: number
        }
      }
    }
  }
}
