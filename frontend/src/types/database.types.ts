export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      activities: {
        Row: {
          activity_id: string
          avg_heart_rate: number | null
          created_at: string
          distance_m: number
          duration_s: number
          elevation_gain_m: number | null
          source: Database["public"]["Enums"]["activity_source"]
          started_at: string
          strava_id: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_id?: string
          avg_heart_rate?: number | null
          created_at?: string
          distance_m: number
          duration_s: number
          elevation_gain_m?: number | null
          source?: Database["public"]["Enums"]["activity_source"]
          started_at: string
          strava_id?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_id?: string
          avg_heart_rate?: number | null
          created_at?: string
          distance_m?: number
          duration_s?: number
          elevation_gain_m?: number | null
          source?: Database["public"]["Enums"]["activity_source"]
          started_at?: string
          strava_id?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      baselines: {
        Row: {
          available_days: number[]
          baseline_id: string
          created_at: string
          km_per_week: number
          longest_run_km: number
          recent_5k_time_s: number
          running_since_months: number
          runs_per_week: number
          user_id: string
        }
        Insert: {
          available_days: number[]
          baseline_id?: string
          created_at?: string
          km_per_week: number
          longest_run_km: number
          recent_5k_time_s: number
          running_since_months: number
          runs_per_week: number
          user_id: string
        }
        Update: {
          available_days?: number[]
          baseline_id?: string
          created_at?: string
          km_per_week?: number
          longest_run_km?: number
          recent_5k_time_s?: number
          running_since_months?: number
          runs_per_week?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "baselines_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      checkins: {
        Row: {
          activity_id: string
          checkin_id: string
          created_at: string
          mood: number
          motivation: number
          note: string | null
          rpe: number
          user_id: string
        }
        Insert: {
          activity_id: string
          checkin_id?: string
          created_at?: string
          mood: number
          motivation: number
          note?: string | null
          rpe: number
          user_id: string
        }
        Update: {
          activity_id?: string
          checkin_id?: string
          created_at?: string
          mood?: number
          motivation?: number
          note?: string | null
          rpe?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkins_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: true
            referencedRelation: "activities"
            referencedColumns: ["activity_id"]
          },
          {
            foreignKeyName: "checkins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      coach_messages: {
        Row: {
          coach_message_id: string
          content: string
          created_at: string
          role: Database["public"]["Enums"]["chat_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          coach_message_id?: string
          content: string
          created_at?: string
          role: Database["public"]["Enums"]["chat_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          coach_message_id?: string
          content?: string
          created_at?: string
          role?: Database["public"]["Enums"]["chat_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      goals: {
        Row: {
          created_at: string
          distance_m: number
          feasibility: Database["public"]["Enums"]["goal_feasibility"] | null
          goal_id: string
          is_active: boolean
          race_date: string
          target_time_s: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          distance_m: number
          feasibility?: Database["public"]["Enums"]["goal_feasibility"] | null
          goal_id?: string
          is_active?: boolean
          race_date: string
          target_time_s: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          distance_m?: number
          feasibility?: Database["public"]["Enums"]["goal_feasibility"] | null
          goal_id?: string
          is_active?: boolean
          race_date?: string
          target_time_s?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      pain_reports: {
        Row: {
          baseline_id: string | null
          checkin_id: string | null
          created_at: string
          level: number
          location: Database["public"]["Enums"]["body_location"]
          pain_report_id: string
          user_id: string
        }
        Insert: {
          baseline_id?: string | null
          checkin_id?: string | null
          created_at?: string
          level: number
          location: Database["public"]["Enums"]["body_location"]
          pain_report_id?: string
          user_id: string
        }
        Update: {
          baseline_id?: string | null
          checkin_id?: string | null
          created_at?: string
          level?: number
          location?: Database["public"]["Enums"]["body_location"]
          pain_report_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pain_reports_baseline_id_fkey"
            columns: ["baseline_id"]
            isOneToOne: false
            referencedRelation: "baselines"
            referencedColumns: ["baseline_id"]
          },
          {
            foreignKeyName: "pain_reports_checkin_id_fkey"
            columns: ["checkin_id"]
            isOneToOne: false
            referencedRelation: "checkins"
            referencedColumns: ["checkin_id"]
          },
          {
            foreignKeyName: "pain_reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      plan_phases: {
        Row: {
          created_at: string
          end_date: string
          focus: string | null
          name: string
          plan_phase_id: string
          position: number
          start_date: string
          training_plan_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date: string
          focus?: string | null
          name: string
          plan_phase_id?: string
          position: number
          start_date: string
          training_plan_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string
          focus?: string | null
          name?: string
          plan_phase_id?: string
          position?: number
          start_date?: string
          training_plan_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_phases_plan_fkey"
            columns: ["training_plan_id", "user_id"]
            isOneToOne: false
            referencedRelation: "training_plans"
            referencedColumns: ["training_plan_id", "user_id"]
          },
        ]
      }
      plan_sessions: {
        Row: {
          activity_id: string | null
          created_at: string
          description: string | null
          plan_phase_id: string | null
          plan_session_id: string
          session_date: string
          session_type: Database["public"]["Enums"]["session_type"]
          status: Database["public"]["Enums"]["session_status"]
          target_distance_m: number | null
          target_duration_s: number | null
          target_pace_max_s_per_km: number | null
          target_pace_min_s_per_km: number | null
          training_plan_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_id?: string | null
          created_at?: string
          description?: string | null
          plan_phase_id?: string | null
          plan_session_id?: string
          session_date: string
          session_type: Database["public"]["Enums"]["session_type"]
          status?: Database["public"]["Enums"]["session_status"]
          target_distance_m?: number | null
          target_duration_s?: number | null
          target_pace_max_s_per_km?: number | null
          target_pace_min_s_per_km?: number | null
          training_plan_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_id?: string | null
          created_at?: string
          description?: string | null
          plan_phase_id?: string | null
          plan_session_id?: string
          session_date?: string
          session_type?: Database["public"]["Enums"]["session_type"]
          status?: Database["public"]["Enums"]["session_status"]
          target_distance_m?: number | null
          target_duration_s?: number | null
          target_pace_max_s_per_km?: number | null
          target_pace_min_s_per_km?: number | null
          training_plan_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_sessions_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: true
            referencedRelation: "activities"
            referencedColumns: ["activity_id"]
          },
          {
            foreignKeyName: "plan_sessions_phase_fkey"
            columns: ["plan_phase_id", "training_plan_id"]
            isOneToOne: false
            referencedRelation: "plan_phases"
            referencedColumns: ["plan_phase_id", "training_plan_id"]
          },
          {
            foreignKeyName: "plan_sessions_plan_fkey"
            columns: ["training_plan_id", "user_id"]
            isOneToOne: false
            referencedRelation: "training_plans"
            referencedColumns: ["training_plan_id", "user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      runner_profiles: {
        Row: {
          created_at: string
          easy_pace_s_per_km: number | null
          fitness_level: Database["public"]["Enums"]["fitness_level"]
          interval_pace_s_per_km: number | null
          predicted_time_s: number | null
          tempo_pace_s_per_km: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          easy_pace_s_per_km?: number | null
          fitness_level: Database["public"]["Enums"]["fitness_level"]
          interval_pace_s_per_km?: number | null
          predicted_time_s?: number | null
          tempo_pace_s_per_km?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          easy_pace_s_per_km?: number | null
          fitness_level?: Database["public"]["Enums"]["fitness_level"]
          interval_pace_s_per_km?: number | null
          predicted_time_s?: number | null
          tempo_pace_s_per_km?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "runner_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      training_plans: {
        Row: {
          activated_at: string | null
          created_at: string
          goal_id: string
          source: Database["public"]["Enums"]["plan_source"]
          status: Database["public"]["Enums"]["plan_status"]
          superseded_at: string | null
          training_plan_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          activated_at?: string | null
          created_at?: string
          goal_id: string
          source: Database["public"]["Enums"]["plan_source"]
          status?: Database["public"]["Enums"]["plan_status"]
          superseded_at?: string | null
          training_plan_id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          activated_at?: string | null
          created_at?: string
          goal_id?: string
          source?: Database["public"]["Enums"]["plan_source"]
          status?: Database["public"]["Enums"]["plan_status"]
          superseded_at?: string | null
          training_plan_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_plans_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["goal_id"]
          },
          {
            foreignKeyName: "training_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      activate_training_plan: {
        Args: { p_training_plan_id: string }
        Returns: undefined
      }
      complete_onboarding: {
        Args: {
          p_available_days: number[]
          p_distance_m: number
          p_km_per_week: number
          p_longest_run_km: number
          p_pains?: Json
          p_race_date: string
          p_recent_5k_time_s: number
          p_running_since_months: number
          p_runs_per_week: number
          p_target_time_s: number
        }
        Returns: string
      }
      save_checkin: {
        Args: {
          p_activity_id: string
          p_mood: number
          p_motivation: number
          p_note?: string
          p_pains?: Json
          p_rpe: number
        }
        Returns: string
      }
      set_session_status: {
        Args: {
          p_plan_session_id: string
          p_status: Database["public"]["Enums"]["session_status"]
        }
        Returns: undefined
      }
    }
    Enums: {
      activity_source: "manual" | "strava"
      body_location:
        | "knee_left"
        | "knee_right"
        | "shin"
        | "achilles"
        | "calf"
        | "foot"
        | "hip"
        | "back"
        | "other"
      chat_role: "user" | "assistant"
      fitness_level: "beginner" | "intermediate" | "advanced"
      goal_feasibility: "realistic" | "ambitious" | "unrealistic"
      plan_source: "ai" | "manual"
      plan_status: "draft" | "active" | "superseded" | "discarded"
      session_status: "planned" | "completed" | "skipped"
      session_type: "easy" | "long" | "tempo" | "interval" | "rest" | "race"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      activity_source: ["manual", "strava"],
      body_location: [
        "knee_left",
        "knee_right",
        "shin",
        "achilles",
        "calf",
        "foot",
        "hip",
        "back",
        "other",
      ],
      chat_role: ["user", "assistant"],
      fitness_level: ["beginner", "intermediate", "advanced"],
      goal_feasibility: ["realistic", "ambitious", "unrealistic"],
      plan_source: ["ai", "manual"],
      plan_status: ["draft", "active", "superseded", "discarded"],
      session_status: ["planned", "completed", "skipped"],
      session_type: ["easy", "long", "tempo", "interval", "rest", "race"],
    },
  },
} as const
