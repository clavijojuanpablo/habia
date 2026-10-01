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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      blocks: {
        Row: {
          blocked: string
          blocker: string
          created_at: string
        }
        Insert: {
          blocked: string
          blocker: string
          created_at?: string
        }
        Update: {
          blocked?: string
          blocker?: string
          created_at?: string
        }
        Relationships: []
      }
      cheers: {
        Row: {
          created_at: string
          day: string
          from_user: string
          id: string
          kind: string
          seen_at: string | null
          to_user: string
        }
        Insert: {
          created_at?: string
          day?: string
          from_user?: string
          id?: string
          kind: string
          seen_at?: string | null
          to_user: string
        }
        Update: {
          created_at?: string
          day?: string
          from_user?: string
          id?: string
          kind?: string
          seen_at?: string | null
          to_user?: string
        }
        Relationships: []
      }
      circle_habits: {
        Row: {
          archived_at: string | null
          circle_id: string
          created_at: string
          created_by: string | null
          icon: string
          id: string
          name: string
          rrule: string
          two_minute_version: string | null
        }
        Insert: {
          archived_at?: string | null
          circle_id: string
          created_at?: string
          created_by?: string | null
          icon?: string
          id?: string
          name: string
          rrule?: string
          two_minute_version?: string | null
        }
        Update: {
          archived_at?: string | null
          circle_id?: string
          created_at?: string
          created_by?: string | null
          icon?: string
          id?: string
          name?: string
          rrule?: string
          two_minute_version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "circle_habits_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "circles"
            referencedColumns: ["id"]
          },
        ]
      }
      circle_members: {
        Row: {
          circle_id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          circle_id: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          circle_id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "circle_members_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "circles"
            referencedColumns: ["id"]
          },
        ]
      }
      circles: {
        Row: {
          created_at: string
          created_by: string | null
          emoji: string
          id: string
          invite_code: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          emoji?: string
          id?: string
          invite_code?: string
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          emoji?: string
          id?: string
          invite_code?: string
          name?: string
        }
        Relationships: []
      }
      coach_messages: {
        Row: {
          content: Json
          created_at: string
          id: string
          kind: string
          model: string
          period_start: string
          seen_at: string | null
          user_id: string
        }
        Insert: {
          content: Json
          created_at?: string
          id?: string
          kind: string
          model: string
          period_start: string
          seen_at?: string | null
          user_id: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          kind?: string
          model?: string
          period_start?: string
          seen_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      friendships: {
        Row: {
          accepted_at: string | null
          created_at: string
          requested_by: string
          status: string
          user_a: string
          user_b: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          requested_by: string
          status?: string
          user_a: string
          user_b: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          requested_by?: string
          status?: string
          user_a?: string
          user_b?: string
        }
        Relationships: []
      }
      garden_state: {
        Row: {
          health: number
          stage: number
          updated_at: string
          user_id: string
          votes: number
        }
        Insert: {
          health?: number
          stage?: number
          updated_at?: string
          user_id: string
          votes?: number
        }
        Update: {
          health?: number
          stage?: number
          updated_at?: string
          user_id?: string
          votes?: number
        }
        Relationships: []
      }
      habit_logs: {
        Row: {
          habit_id: string
          id: string
          logged_at: string
          mood: number | null
          note: string | null
          occurrence_at: string
          status: Database["public"]["Enums"]["habit_log_status"]
          user_id: string
        }
        Insert: {
          habit_id: string
          id?: string
          logged_at?: string
          mood?: number | null
          note?: string | null
          occurrence_at: string
          status?: Database["public"]["Enums"]["habit_log_status"]
          user_id: string
        }
        Update: {
          habit_id?: string
          id?: string
          logged_at?: string
          mood?: number | null
          note?: string | null
          occurrence_at?: string
          status?: Database["public"]["Enums"]["habit_log_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_logs_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          anchor_habit_id: string | null
          archived_at: string | null
          circle_habit_id: string | null
          color: string | null
          context_label: string | null
          created_at: string
          cue_type: Database["public"]["Enums"]["habit_cue_type"]
          icon: string
          id: string
          identity_id: string | null
          implementation_intention: string | null
          name: string
          reminder_minutes_before: number | null
          rrule: string
          sort_order: number
          starts_on: string
          temptation_bundle: string | null
          two_minute_version: string | null
          updated_at: string
          user_id: string
          window_end: string | null
          window_start: string | null
        }
        Insert: {
          anchor_habit_id?: string | null
          archived_at?: string | null
          circle_habit_id?: string | null
          color?: string | null
          context_label?: string | null
          created_at?: string
          cue_type?: Database["public"]["Enums"]["habit_cue_type"]
          icon?: string
          id?: string
          identity_id?: string | null
          implementation_intention?: string | null
          name: string
          reminder_minutes_before?: number | null
          rrule?: string
          sort_order?: number
          starts_on?: string
          temptation_bundle?: string | null
          two_minute_version?: string | null
          updated_at?: string
          user_id: string
          window_end?: string | null
          window_start?: string | null
        }
        Update: {
          anchor_habit_id?: string | null
          archived_at?: string | null
          circle_habit_id?: string | null
          color?: string | null
          context_label?: string | null
          created_at?: string
          cue_type?: Database["public"]["Enums"]["habit_cue_type"]
          icon?: string
          id?: string
          identity_id?: string | null
          implementation_intention?: string | null
          name?: string
          reminder_minutes_before?: number | null
          rrule?: string
          sort_order?: number
          starts_on?: string
          temptation_bundle?: string | null
          two_minute_version?: string | null
          updated_at?: string
          user_id?: string
          window_end?: string | null
          window_start?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "habits_anchor_habit_id_fkey"
            columns: ["anchor_habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "habits_identity_id_fkey"
            columns: ["identity_id"]
            isOneToOne: false
            referencedRelation: "identities"
            referencedColumns: ["id"]
          },
        ]
      }
      identities: {
        Row: {
          area: string | null
          color: string | null
          created_at: string
          id: string
          sort_order: number
          statement: string
          user_id: string
        }
        Insert: {
          area?: string | null
          color?: string | null
          created_at?: string
          id?: string
          sort_order?: number
          statement: string
          user_id: string
        }
        Update: {
          area?: string | null
          color?: string | null
          created_at?: string
          id?: string
          sort_order?: number
          statement?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          afternoon_starts_at: number
          ai_coach_enabled: boolean
          best_streak: number
          created_at: string
          display_name: string | null
          id: string
          locale: string
          morning_starts_at: number
          night_ends_at: number
          night_starts_at: number
          onboarded_at: string | null
          theme_preference: string
          timezone: string
          updated_at: string
          week_starts_on: number
        }
        Insert: {
          afternoon_starts_at?: number
          ai_coach_enabled?: boolean
          best_streak?: number
          created_at?: string
          display_name?: string | null
          id: string
          locale?: string
          morning_starts_at?: number
          night_ends_at?: number
          night_starts_at?: number
          onboarded_at?: string | null
          theme_preference?: string
          timezone?: string
          updated_at?: string
          week_starts_on?: number
        }
        Update: {
          afternoon_starts_at?: number
          ai_coach_enabled?: boolean
          best_streak?: number
          created_at?: string
          display_name?: string | null
          id?: string
          locale?: string
          morning_starts_at?: number
          night_ends_at?: number
          night_starts_at?: number
          onboarded_at?: string | null
          theme_preference?: string
          timezone?: string
          updated_at?: string
          week_starts_on?: number
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          reason: string
          reported: string
          reporter: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reported: string
          reporter?: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reported?: string
          reporter?: string
        }
        Relationships: []
      }
      social_profiles: {
        Row: {
          color: string
          created_at: string
          display_name: string
          stats: Json
          stats_updated_at: string | null
          user_id: string
          username: string
        }
        Insert: {
          color?: string
          created_at?: string
          display_name: string
          stats?: Json
          stats_updated_at?: string | null
          user_id: string
          username: string
        }
        Update: {
          color?: string
          created_at?: string
          display_name?: string
          stats?: Json
          stats_updated_at?: string | null
          user_id?: string
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      habit_completion_counts: {
        Row: {
          completions: number | null
          habit_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "habit_logs_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      accept_friend_request: { Args: { p_user: string }; Returns: boolean }
      block_user: { Args: { p_user: string }; Returns: undefined }
      circle_habit_days: {
        Args: { p_circle_habit: string; p_since: string }
        Returns: {
          day: string
          done: boolean
          skipped: boolean
          user_id: string
        }[]
      }
      circle_habit_members: {
        Args: { p_circle_habit: string }
        Returns: {
          joined_on: string
          user_id: string
        }[]
      }
      create_circle: {
        Args: { p_emoji: string; p_name: string }
        Returns: string
      }
      find_profile: {
        Args: { p_username: string }
        Returns: {
          color: string
          display_name: string
          user_id: string
          username: string
        }[]
      }
      join_circle: { Args: { p_code: string }; Returns: string }
      list_friendships: {
        Args: never
        Returns: {
          color: string
          created_at: string
          display_name: string
          incoming: boolean
          status: string
          user_id: string
          username: string
        }[]
      }
      local_today: { Args: { p_timezone: string }; Returns: string }
      regenerate_circle_code: { Args: { p_circle: string }; Returns: string }
      send_friend_request: { Args: { p_username: string }; Returns: string }
      social_days: {
        Args: { p_since: string; p_users: string[] }
        Returns: {
          active: boolean
          day: string
          skipped: boolean
          user_id: string
        }[]
      }
    }
    Enums: {
      habit_cue_type: "time" | "after_habit" | "context"
      habit_log_status: "done" | "done_minimum" | "skipped" | "missed"
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
  public: {
    Enums: {
      habit_cue_type: ["time", "after_habit", "context"],
      habit_log_status: ["done", "done_minimum", "skipped", "missed"],
    },
  },
} as const
