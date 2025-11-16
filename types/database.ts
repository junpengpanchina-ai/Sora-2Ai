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
          credits: number
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
          credits?: number
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
          credits?: number
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
      recharge_records: {
        Row: {
          id: string
          user_id: string
          amount: number
          credits: number
          payment_method: string | null
          payment_id: string | null
          status: 'pending' | 'completed' | 'failed' | 'cancelled'
          created_at: string
          updated_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          credits: number
          payment_method?: string | null
          payment_id?: string | null
          status?: 'pending' | 'completed' | 'failed' | 'cancelled'
          created_at?: string
          updated_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          credits?: number
          payment_method?: string | null
          payment_id?: string | null
          status?: 'pending' | 'completed' | 'failed' | 'cancelled'
          created_at?: string
          updated_at?: string
          completed_at?: string | null
        }
      }
      consumption_records: {
        Row: {
          id: string
          user_id: string
          video_task_id: string | null
          credits: number
          description: string | null
          status: 'completed' | 'refunded'
          created_at: string
          refunded_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          video_task_id?: string | null
          credits: number
          description?: string | null
          status?: 'completed' | 'refunded'
          created_at?: string
          refunded_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          video_task_id?: string | null
          credits?: number
          description?: string | null
          status?: 'completed' | 'refunded'
          created_at?: string
          refunded_at?: string | null
        }
      }
      after_sales_issues: {
        Row: {
          id: string
          user_name: string
          contact_phone: string
          contact_email: string | null
          issue_category: string | null
          issue_description: string
          status: 'open' | 'in_progress' | 'resolved' | 'closed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_name: string
          contact_phone: string
          contact_email?: string | null
          issue_category?: string | null
          issue_description: string
          status?: 'open' | 'in_progress' | 'resolved' | 'closed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_name?: string
          contact_phone?: string
          contact_email?: string | null
          issue_category?: string | null
          issue_description?: string
          status?: 'open' | 'in_progress' | 'resolved' | 'closed'
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

