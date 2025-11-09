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
      video_tasks: {
        Row: {
          id: string
          user_id: string
          grsai_task_id: string | null
          model: string
          prompt: string
          reference_url: string | null
          aspect_ratio: string
          duration: number
          size: string
          status: 'pending' | 'processing' | 'succeeded' | 'failed'
          progress: number
          video_url: string | null
          remove_watermark: boolean
          pid: string | null
          failure_reason: string | null
          error_message: string | null
          webhook_url: string | null
          created_at: string
          updated_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          grsai_task_id?: string | null
          model?: string
          prompt: string
          reference_url?: string | null
          aspect_ratio?: string
          duration?: number
          size?: string
          status?: 'pending' | 'processing' | 'succeeded' | 'failed'
          progress?: number
          video_url?: string | null
          remove_watermark?: boolean
          pid?: string | null
          failure_reason?: string | null
          error_message?: string | null
          webhook_url?: string | null
          created_at?: string
          updated_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          grsai_task_id?: string | null
          model?: string
          prompt?: string
          reference_url?: string | null
          aspect_ratio?: string
          duration?: number
          size?: string
          status?: 'pending' | 'processing' | 'succeeded' | 'failed'
          progress?: number
          video_url?: string | null
          remove_watermark?: boolean
          pid?: string | null
          failure_reason?: string | null
          error_message?: string | null
          webhook_url?: string | null
          created_at?: string
          updated_at?: string
          completed_at?: string | null
        }
      }
    }
  }
}

