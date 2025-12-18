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
          status: 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded'
          created_at: string
          updated_at: string
          completed_at: string | null
          admin_notes: string | null
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          credits: number
          payment_method?: string | null
          payment_id?: string | null
          status?: 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded'
          created_at?: string
          updated_at?: string
          completed_at?: string | null
          admin_notes?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          credits?: number
          payment_method?: string | null
          payment_id?: string | null
          status?: 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded'
          created_at?: string
          updated_at?: string
          completed_at?: string | null
          admin_notes?: string | null
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
          admin_notes: string | null
          handled_by: string | null
          resolved_at: string | null
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
          admin_notes?: string | null
          handled_by?: string | null
          resolved_at?: string | null
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
          admin_notes?: string | null
          handled_by?: string | null
          resolved_at?: string | null
        }
      }
      credit_adjustments: {
        Row: {
          id: string
          user_id: string
          admin_user_id: string | null
          delta: number
          adjustment_type:
            | 'manual_increase'
            | 'manual_decrease'
            | 'recharge_correction'
            | 'recharge_refund'
            | 'consumption_refund'
            | 'other'
          reason: string | null
          related_recharge_id: string | null
          related_consumption_id: string | null
          before_credits: number | null
          after_credits: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          admin_user_id?: string | null
          delta: number
          adjustment_type?:
            | 'manual_increase'
            | 'manual_decrease'
            | 'recharge_correction'
            | 'recharge_refund'
            | 'consumption_refund'
            | 'other'
          reason?: string | null
          related_recharge_id?: string | null
          related_consumption_id?: string | null
          before_credits?: number | null
          after_credits?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          admin_user_id?: string | null
          delta?: number
          adjustment_type?:
            | 'manual_increase'
            | 'manual_decrease'
            | 'recharge_correction'
            | 'recharge_refund'
            | 'consumption_refund'
            | 'other'
          reason?: string | null
          related_recharge_id?: string | null
          related_consumption_id?: string | null
          before_credits?: number | null
          after_credits?: number | null
          created_at?: string
        }
      }
      admin_users: {
        Row: {
          id: string
          username: string
          password_hash: string
          is_super_admin: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          username: string
          password_hash: string
          is_super_admin?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          password_hash?: string
          is_super_admin?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      admin_sessions: {
        Row: {
          id: string
          admin_user_id: string
          token_hash: string
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          admin_user_id: string
          token_hash: string
          expires_at: string
          created_at?: string
        }
        Update: {
          id?: string
          admin_user_id?: string
          token_hash?: string
          expires_at?: string
          created_at?: string
        }
      }
      prompt_library: {
        Row: {
          id: string
          title: string
          description: string | null
          prompt: string
          category: 'nature' | 'character' | 'action' | 'scenery' | 'abstract' | 'cinematic'
          tags: string[]
          difficulty: 'information' | 'comparison' | 'transaction'
          example: string | null
          locale: 'zh' | 'en'
          slug: string | null
          is_published: boolean
          created_by_admin_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          prompt: string
          category: 'nature' | 'character' | 'action' | 'scenery' | 'abstract' | 'cinematic'
          tags?: string[]
          difficulty: 'information' | 'comparison' | 'transaction'
          example?: string | null
          locale?: 'zh' | 'en'
          slug?: string | null
          is_published?: boolean
          created_by_admin_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          prompt?: string
          category?: 'nature' | 'character' | 'action' | 'scenery' | 'abstract' | 'cinematic'
          tags?: string[]
          difficulty?: 'information' | 'comparison' | 'transaction'
          example?: string | null
          locale?: 'zh' | 'en'
          slug?: string | null
          is_published?: boolean
          created_by_admin_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      long_tail_keywords: {
        Row: {
          id: string
          keyword: string
          intent: 'information' | 'comparison' | 'transaction' | 'information_comparison_transaction'
          product: string | null
          service: string | null
          region: string | null
          pain_point: string | null
          search_volume: number | null
          competition_score: number | null
          priority: number
          page_slug: string
          page_style: 'default' | 'christmas' | 'official'
          title: string | null
          meta_description: string | null
          h1: string | null
          intro_paragraph: string | null
          steps: Json
          faq: Json
          status: 'draft' | 'published'
          last_generated_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          keyword: string
          intent: 'information' | 'comparison' | 'transaction' | 'information_comparison_transaction'
          product?: string | null
          service?: string | null
          region?: string | null
          pain_point?: string | null
          search_volume?: number | null
          competition_score?: number | null
          priority?: number
          page_slug: string
          page_style?: 'default' | 'christmas' | 'official'
          title?: string | null
          meta_description?: string | null
          h1?: string | null
          intro_paragraph?: string | null
          steps?: Json
          faq?: Json
          status?: 'draft' | 'published'
          last_generated_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          keyword?: string
          intent?: 'information' | 'comparison' | 'transaction' | 'information_comparison_transaction'
          product?: string | null
          service?: string | null
          region?: string | null
          pain_point?: string | null
          search_volume?: number | null
          competition_score?: number | null
          priority?: number
          page_slug?: string
          page_style?: 'default' | 'christmas' | 'official'
          title?: string | null
          meta_description?: string | null
          h1?: string | null
          intro_paragraph?: string | null
          steps?: Json
          faq?: Json
          status?: 'draft' | 'published'
          last_generated_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      dynamic_page_seo: {
        Row: {
          id: string
          page_path: string
          page_params: Json | null
          page_url: string
          title: string
          description: string | null
          h1_text: string | null
          seo_content: string | null
          meta_keywords: string[] | null
          is_active: boolean
          priority: number
          created_by_admin_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          page_path: string
          page_params?: Json | null
          page_url: string
          title: string
          description?: string | null
          h1_text?: string | null
          seo_content?: string | null
          meta_keywords?: string[] | null
          is_active?: boolean
          priority?: number
          created_by_admin_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          page_path?: string
          page_params?: Json | null
          page_url?: string
          title?: string
          description?: string | null
          h1_text?: string | null
          seo_content?: string | null
          meta_keywords?: string[] | null
          is_active?: boolean
          priority?: number
          created_by_admin_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      blog_posts: {
        Row: {
          id: string
          slug: string
          title: string
          description: string
          h1: string
          content: string
          published_at: string | null
          is_published: boolean
          related_posts: string[]
          seo_keywords: string[]
          created_by_admin_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          title: string
          description: string
          h1: string
          content: string
          published_at?: string | null
          is_published?: boolean
          related_posts?: string[]
          seo_keywords?: string[]
          created_by_admin_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          title?: string
          description?: string
          h1?: string
          content?: string
          published_at?: string | null
          is_published?: boolean
          related_posts?: string[]
          seo_keywords?: string[]
          created_by_admin_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      use_cases: {
        Row: {
          id: string
          slug: string
          title: string
          h1: string
          description: string
          content: string
          use_case_type: 'marketing' | 'social-media' | 'youtube' | 'tiktok' | 'product-demo' | 'ads' | 'education' | 'other'
          industry: string | null
          featured_prompt_ids: string[]
          related_use_case_ids: string[]
          seo_keywords: string[]
          is_published: boolean
          created_by_admin_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          title: string
          h1: string
          description: string
          content: string
          use_case_type: 'marketing' | 'social-media' | 'youtube' | 'tiktok' | 'product-demo' | 'ads' | 'education' | 'other'
          industry?: string | null
          featured_prompt_ids?: string[]
          related_use_case_ids?: string[]
          seo_keywords?: string[]
          is_published?: boolean
          created_by_admin_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          title?: string
          h1?: string
          description?: string
          content?: string
          use_case_type?: 'marketing' | 'social-media' | 'youtube' | 'tiktok' | 'product-demo' | 'ads' | 'education' | 'other'
          industry?: string | null
          featured_prompt_ids?: string[]
          related_use_case_ids?: string[]
          seo_keywords?: string[]
          is_published?: boolean
          created_by_admin_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      compare_pages: {
        Row: {
          id: string
          slug: string
          title: string
          h1: string
          description: string
          content: string
          tool_a_name: string
          tool_b_name: string
          comparison_points: Json
          winner: 'tool_a' | 'tool_b' | 'tie' | null
          seo_keywords: string[]
          is_published: boolean
          created_by_admin_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          title: string
          h1: string
          description: string
          content: string
          tool_a_name?: string
          tool_b_name: string
          comparison_points?: Json
          winner?: 'tool_a' | 'tool_b' | 'tie' | null
          seo_keywords?: string[]
          is_published?: boolean
          created_by_admin_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          title?: string
          h1?: string
          description?: string
          content?: string
          tool_a_name?: string
          tool_b_name?: string
          comparison_points?: Json
          winner?: 'tool_a' | 'tool_b' | 'tie' | null
          seo_keywords?: string[]
          is_published?: boolean
          created_by_admin_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Functions: {
      admin_adjust_user_credits: {
        Args: {
          p_admin_user_id: string | null
          p_user_id: string
          p_delta: number
          p_reason: string | null
          p_adjustment_type:
            | 'manual_increase'
            | 'manual_decrease'
            | 'recharge_correction'
            | 'recharge_refund'
            | 'consumption_refund'
            | 'other'
          p_related_recharge_id?: string | null
          p_related_consumption_id?: string | null
        }
        Returns: Database['public']['Tables']['credit_adjustments']['Row']
      }
      admin_create_session: {
        Args: {
          p_username: string
          p_password: string
          p_token_hash: string
          p_expires_at: string
        }
        Returns: Database['public']['Tables']['admin_sessions']['Row']
      }
      admin_delete_session: {
        Args: {
          p_token_hash: string
        }
        Returns: boolean
      }
      admin_validate_session: {
        Args: {
          p_token_hash: string
        }
        Returns: Database['public']['Tables']['admin_users']['Row'] | null
      }
    }
  }
}

