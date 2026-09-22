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
          created_at: string
          display_name: string | null
          id: string
          locale: string
          morning_starts_at: number
          night_ends_at: number
          night_starts_at: number
          theme_preference: string
          timezone: string
          updated_at: string
          week_starts_on: number
        }
        Insert: {
          afternoon_starts_at?: number
          created_at?: string
          display_name?: string | null
          id: string
          locale?: string
          morning_starts_at?: number
          night_ends_at?: number
          night_starts_at?: number
          theme_preference?: string
          timezone?: string
          updated_at?: string
          week_starts_on?: number
        }
        Update: {
          afternoon_starts_at?: number
          created_at?: string
          display_name?: string | null
          id?: string
          locale?: string
          morning_starts_at?: number
          night_ends_at?: number
          night_starts_at?: number
          theme_preference?: string
          timezone?: string
          updated_at?: string
          week_starts_on?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
