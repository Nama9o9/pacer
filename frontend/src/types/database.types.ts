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
          created_at: string
          level: number
          location: Database["public"]["Enums"]["body_location"]
          pain_report_id: string
          user_id: string
        }
        Insert: {
          baseline_id?: string | null
          created_at?: string
          level: number
          location: Database["public"]["Enums"]["body_location"]
          pain_report_id?: string
          user_id: string
        }
        Update: {
          baseline_id?: string | null
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
            foreignKeyName: "pain_reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
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
      fitness_level: "beginner" | "intermediate" | "advanced"
      goal_feasibility: "realistic" | "ambitious" | "unrealistic"
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
      fitness_level: ["beginner", "intermediate", "advanced"],
      goal_feasibility: ["realistic", "ambitious", "unrealistic"],
    },
  },
} as const
