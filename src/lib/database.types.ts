export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      assignments: {
        Row: { id: string; institution_id: string; course_id: string; lesson_id: string | null; title: string; instructions: string | null; due_at: string | null; points: number; created_by: string | null; created_at: string }
        Insert: { id?: string; institution_id: string; course_id: string; lesson_id?: string | null; title: string; instructions?: string | null; due_at?: string | null; points?: number; created_by?: string | null; created_at?: string }
        Update: Partial<Database['public']['Tables']['assignments']['Insert']>
        Relationships: []
      }
      assignment_submissions: {
        Row: { id: string; assignment_id: string; student_id: string; body: string | null; link_url: string | null; status: string; grade: number | null; feedback: string | null; graded_by: string | null; submitted_at: string; graded_at: string | null }
        Insert: { id?: string; assignment_id: string; student_id: string; body?: string | null; link_url?: string | null; status?: string; grade?: number | null; feedback?: string | null; graded_by?: string | null; submitted_at?: string; graded_at?: string | null }
        Update: Partial<Database['public']['Tables']['assignment_submissions']['Insert']>
        Relationships: []
      }
      certificates: {
        Row: { course_id: string; id: string; institution_id: string; issued_at: string; serial: string; user_id: string }
        Insert: { course_id: string; id?: string; institution_id: string; issued_at?: string; serial: string; user_id: string }
        Update: Partial<{ course_id: string; id: string; institution_id: string; issued_at: string; serial: string; user_id: string }>
        Relationships: []
      }
      community_groups: {
        Row: { color: string | null; created_at: string; id: string; institution_id: string; name: string; position: number; slug: string }
        Insert: { color?: string | null; created_at?: string; id?: string; institution_id: string; name: string; position?: number; slug: string }
        Update: Partial<{ color: string | null; id: string; institution_id: string; name: string; position: number; slug: string }>
        Relationships: []
      }
      coupons: {
        Row: { active: boolean; amount: number; code: string; created_at: string; discount_type: string; id: string; institution_id: string; uses_count: number }
        Insert: { active?: boolean; amount?: number; code: string; created_at?: string; discount_type?: string; id?: string; institution_id: string; uses_count?: number }
        Update: Partial<{ active: boolean; amount: number; code: string; discount_type: string; id: string; institution_id: string; uses_count: number }>
        Relationships: []
      }
      courses: {
        Row: { accent: string | null; category: string | null; cover_url: string | null; created_at: string; created_by: string | null; description: string | null; drip_enabled: boolean; icon: string | null; id: string; institution_id: string; instructor_id: string | null; is_live: boolean; level: string | null; module_lock: boolean; price_cents: number; published_at: string | null; rating: number | null; status: string; subtitle: string | null; title: string; zoom_meeting_id: string | null; zoom_url: string | null }
        Insert: { accent?: string | null; category?: string | null; cover_url?: string | null; created_at?: string; created_by?: string | null; description?: string | null; drip_enabled?: boolean; icon?: string | null; id?: string; institution_id: string; instructor_id?: string | null; is_live?: boolean; level?: string | null; module_lock?: boolean; price_cents?: number; published_at?: string | null; rating?: number | null; status?: string; subtitle?: string | null; title: string; zoom_meeting_id?: string | null; zoom_url?: string | null }
        Update: Partial<Database['public']['Tables']['courses']['Insert']>
        Relationships: []
      }
      enrollments: {
        Row: { course_id: string; enrolled_at: string; id: string; institution_id: string; last_active_at: string; plan_id: string | null; status: string; user_id: string }
        Insert: { course_id: string; enrolled_at?: string; id?: string; institution_id: string; last_active_at?: string; plan_id?: string | null; status?: string; user_id: string }
        Update: Partial<Database['public']['Tables']['enrollments']['Insert']>
        Relationships: []
      }
      events: {
        Row: { created_at: string; group_id: string | null; host_id: string | null; id: string; institution_id: string; starts_at: string; title: string }
        Insert: { created_at?: string; group_id?: string | null; host_id?: string | null; id?: string; institution_id: string; starts_at: string; title: string }
        Update: Partial<Database['public']['Tables']['events']['Insert']>
        Relationships: []
      }
      group_members: {
        Row: { created_at: string; group_id: string; id: string; user_id: string }
        Insert: { created_at?: string; group_id: string; id?: string; user_id: string }
        Update: Partial<{ group_id: string; id: string; user_id: string }>
        Relationships: []
      }
      institutions: {
        Row: { created_at: string; currency: string; id: string; language: string; logo_url: string | null; name: string; primary_color: string | null; subdomain: string; timezone: string }
        Insert: { created_at?: string; currency?: string; id?: string; language?: string; logo_url?: string | null; name: string; primary_color?: string | null; subdomain: string; timezone?: string }
        Update: Partial<Database['public']['Tables']['institutions']['Insert']>
        Relationships: []
      }
      lesson_progress: {
        Row: { completed_at: string | null; id: string; lesson_id: string; seconds: number; updated_at: string; user_id: string }
        Insert: { completed_at?: string | null; id?: string; lesson_id: string; seconds?: number; updated_at?: string; user_id: string }
        Update: Partial<Database['public']['Tables']['lesson_progress']['Insert']>
        Relationships: []
      }
      lesson_resources: {
        Row: { created_at: string; file_url: string | null; icon: string | null; id: string; kind: string | null; lesson_id: string; name: string; position: number; size_label: string | null }
        Insert: { created_at?: string; file_url?: string | null; icon?: string | null; id?: string; kind?: string | null; lesson_id: string; name: string; position?: number; size_label?: string | null }
        Update: Partial<Database['public']['Tables']['lesson_resources']['Insert']>
        Relationships: []
      }
      lessons: {
        Row: { body: string | null; content_type: string; created_at: string; duration: string | null; duration_seconds: number | null; external_url: string | null; file_url: string | null; id: string; is_preview: boolean; position: number; section_id: string; title: string }
        Insert: { body?: string | null; content_type?: string; created_at?: string; duration?: string | null; duration_seconds?: number | null; external_url?: string | null; file_url?: string | null; id?: string; is_preview?: boolean; position?: number; section_id: string; title: string }
        Update: Partial<Database['public']['Tables']['lessons']['Insert']>
        Relationships: []
      }
      course_instructors: {
        Row: { id: string; course_id: string; user_id: string; created_at: string }
        Insert: { id?: string; course_id: string; user_id: string; created_at?: string }
        Update: Partial<Database['public']['Tables']['course_instructors']['Insert']>
        Relationships: []
      }
      memberships: {
        Row: { created_at: string; id: string; institution_id: string | null; role: string; status: string; user_id: string }
        Insert: { created_at?: string; id?: string; institution_id?: string | null; role: string; status?: string; user_id: string }
        Update: Partial<Database['public']['Tables']['memberships']['Insert']>
        Relationships: []
      }
      badges: {
        Row: { id: string; institution_id: string; code: string; name: string; description: string | null; icon: string | null; color: string | null }
        Insert: { id?: string; institution_id: string; code: string; name: string; description?: string | null; icon?: string | null; color?: string | null }
        Update: Partial<Database['public']['Tables']['badges']['Insert']>
        Relationships: []
      }
      user_badges: {
        Row: { id: string; user_id: string; badge_id: string; awarded_at: string }
        Insert: { id?: string; user_id: string; badge_id: string; awarded_at?: string }
        Update: Partial<Database['public']['Tables']['user_badges']['Insert']>
        Relationships: []
      }
      course_questions: {
        Row: { id: string; institution_id: string; course_id: string; lesson_id: string | null; author_id: string; body: string; resolved: boolean; created_at: string }
        Insert: { id?: string; institution_id: string; course_id: string; lesson_id?: string | null; author_id: string; body: string; resolved?: boolean; created_at?: string }
        Update: Partial<Database['public']['Tables']['course_questions']['Insert']>
        Relationships: []
      }
      question_answers: {
        Row: { id: string; question_id: string; author_id: string; body: string; is_official: boolean; created_at: string }
        Insert: { id?: string; question_id: string; author_id: string; body: string; is_official?: boolean; created_at?: string }
        Update: Partial<Database['public']['Tables']['question_answers']['Insert']>
        Relationships: []
      }
      notifications: {
        Row: { id: string; user_id: string; institution_id: string | null; kind: string; title: string; body: string | null; link: string | null; read_at: string | null; created_at: string }
        Insert: { id?: string; user_id: string; institution_id?: string | null; kind?: string; title: string; body?: string | null; link?: string | null; read_at?: string | null; created_at?: string }
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>
        Relationships: []
      }
      notes: {
        Row: { body: string; id: string; lesson_id: string; updated_at: string; user_id: string }
        Insert: { body?: string; id?: string; lesson_id: string; updated_at?: string; user_id: string }
        Update: Partial<Database['public']['Tables']['notes']['Insert']>
        Relationships: []
      }
      orders: {
        Row: { amount_cents: number; coupon_id: string | null; course_id: string | null; created_at: string; id: string; institution_id: string; plan_id: string | null; status: string; user_id: string; provider: string; stripe_session_id: string | null }
        Insert: { amount_cents?: number; coupon_id?: string | null; course_id?: string | null; created_at?: string; id?: string; institution_id: string; plan_id?: string | null; status?: string; user_id: string; provider?: string; stripe_session_id?: string | null }
        Update: Partial<Database['public']['Tables']['orders']['Insert']>
        Relationships: []
      }
      plans: {
        Row: { code: string; created_at: string; id: string; institution_id: string; interval: string; name: string; position: number; price_cents: number; stripe_price_id: string | null }
        Insert: { code: string; created_at?: string; id?: string; institution_id: string; interval?: string; name: string; position?: number; price_cents?: number }
        Update: Partial<Database['public']['Tables']['plans']['Insert']>
        Relationships: []
      }
      points_ledger: {
        Row: { created_at: string; id: string; institution_id: string; points: number; reason: string | null; user_id: string }
        Insert: { created_at?: string; id?: string; institution_id: string; points?: number; reason?: string | null; user_id: string }
        Update: Partial<Database['public']['Tables']['points_ledger']['Insert']>
        Relationships: []
      }
      post_comments: {
        Row: { author_id: string; body: string; created_at: string; id: string; post_id: string }
        Insert: { author_id: string; body: string; created_at?: string; id?: string; post_id: string }
        Update: Partial<{ author_id: string; body: string; id: string; post_id: string }>
        Relationships: []
      }
      post_likes: {
        Row: { created_at: string; id: string; post_id: string; user_id: string }
        Insert: { created_at?: string; id?: string; post_id: string; user_id: string }
        Update: Partial<{ id: string; post_id: string; user_id: string }>
        Relationships: []
      }
      posts: {
        Row: { author_id: string; body: string; created_at: string; group_id: string | null; id: string; institution_id: string }
        Insert: { author_id: string; body: string; created_at?: string; group_id?: string | null; id?: string; institution_id: string }
        Update: Partial<Database['public']['Tables']['posts']['Insert']>
        Relationships: []
      }
      profiles: {
        Row: { avatar_url: string | null; created_at: string; full_name: string | null; id: string }
        Insert: { avatar_url?: string | null; created_at?: string; full_name?: string | null; id: string }
        Update: Partial<{ avatar_url: string | null; full_name: string | null; id: string }>
        Relationships: []
      }
      quiz_attempts: {
        Row: { answers: Json; created_at: string; id: string; quiz_id: string; score: number; user_id: string }
        Insert: { answers?: Json; created_at?: string; id?: string; quiz_id: string; score?: number; user_id: string }
        Update: Partial<Database['public']['Tables']['quiz_attempts']['Insert']>
        Relationships: []
      }
      quiz_options: {
        Row: { id: string; is_correct: boolean; label: string; position: number; question_id: string }
        Insert: { id?: string; is_correct?: boolean; label: string; position?: number; question_id: string }
        Update: Partial<Database['public']['Tables']['quiz_options']['Insert']>
        Relationships: []
      }
      quiz_questions: {
        Row: { id: string; points: number; position: number; prompt: string; quiz_id: string; question_type: string; answer_text: string | null }
        Insert: { id?: string; points?: number; position?: number; prompt: string; quiz_id: string; question_type?: string; answer_text?: string | null }
        Update: Partial<Database['public']['Tables']['quiz_questions']['Insert']>
        Relationships: []
      }
      quizzes: {
        Row: { created_at: string; id: string; lesson_id: string; pass_score: number; title: string }
        Insert: { created_at?: string; id?: string; lesson_id: string; pass_score?: number; title: string }
        Update: Partial<Database['public']['Tables']['quizzes']['Insert']>
        Relationships: []
      }
      sections: {
        Row: { course_id: string; created_at: string; id: string; position: number; title: string }
        Insert: { course_id: string; created_at?: string; id?: string; position?: number; title: string }
        Update: Partial<Database['public']['Tables']['sections']['Insert']>
        Relationships: []
      }
    }
    Views: {
      course_progress: {
        Row: { course_id: string | null; done: number | null; pct: number | null; total: number | null; user_id: string | null }
        Relationships: []
      }
      leaderboard: {
        Row: { full_name: string | null; institution_id: string | null; rank: number | null; total_points: number | null; user_id: string | null }
        Relationships: []
      }
    }
    Functions: {
      activity_feed: { Args: { p_institution_id: string; p_limit?: number }; Returns: { at: string; kind: string; text: string }[] }
      admin_dashboard_stats: { Args: { p_institution_id: string }; Returns: Json }
      enrollment_mix: { Args: { p_institution_id: string }; Returns: { category: string; enrollments: number; pct: number }[] }
      mrr: { Args: { p_institution_id: string }; Returns: Json }
      my_institution_id: { Args: never; Returns: string }
      revenue_monthly: { Args: { p_institution_id: string }; Returns: { amount_cents: number; label: string; month_start: string }[] }
      sales_stats: { Args: { p_institution_id: string }; Returns: Json }
      teacher_dashboard_stats: { Args: { p_institution_id: string; p_teacher_id?: string }; Returns: Json }
      top_courses: { Args: { p_institution_id: string; p_limit?: number }; Returns: { accent: string; icon: string; id: string; instructor: string; rating: number; revenue_cents: number; status: string; students: number; title: string }[] }
      verify_certificate: { Args: { p_serial: string }; Returns: Json }
      course_gradebook: { Args: { p_course_id: string }; Returns: { user_id: string; full_name: string; progress_pct: number; quiz_avg: number | null; assignment_avg: number | null }[] }
      course_dropoff: { Args: { p_course_id: string }; Returns: { lesson_id: string; title: string; ord: number; completed: number; enrolled: number }[] }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Views<T extends keyof Database['public']['Views']> = Database['public']['Views'][T]['Row']
