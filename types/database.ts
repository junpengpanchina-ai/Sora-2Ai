export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          google_id: string
          email: string
          name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
          last_login_at: string | null
          status: 'active' | 'inactive' | 'banned'
        }
        Insert: {
          id?: string
          google_id: string
          email: string
          name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
          last_login_at?: string | null
          status?: 'active' | 'inactive' | 'banned'
        }
        Update: {
          id?: string
          google_id?: string
          email?: string
          name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
          last_login_at?: string | null
          status?: 'active' | 'inactive' | 'banned'
        }
      }
    }
  }
}

