export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type TrainingStage =
  | 'Medical Student'
  | 'FY1'
  | 'FY2'
  | 'F3'
  | 'CT1'
  | 'CT2'
  | 'IMT1'
  | 'IMT2'
  | 'IMT3'
  | 'ST1'
  | 'ST2'
  | 'ST3'
  | 'ST4'
  | 'ST5'
  | 'ST6'
  | 'ST7'
  | 'ST8'
  | 'SAS'
  | 'Consultant'
  | 'GP_Trainee'
  | 'Other';

export type ItemStatus = 'not_started' | 'in_progress' | 'completed';
export type CaseComplexity = 'routine' | 'moderate' | 'complex' | 'rare';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          training_stage: TrainingStage | null;
          primary_specialty: string;
          secondary_specialties: string[];
          hidden_specialties: string[];
          region: string;
          avatar_url: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string;
          email?: string;
          training_stage?: TrainingStage | null;
          primary_specialty?: string;
          secondary_specialties?: string[];
          hidden_specialties?: string[];
          region?: string;
          avatar_url?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string;
          training_stage?: TrainingStage | null;
          primary_specialty?: string;
          secondary_specialties?: string[];
          hidden_specialties?: string[];
          region?: string;
          avatar_url?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: never[];
      };
      checklist_templates: {
        Row: {
          id: string;
          specialty: string;
          training_year: string;
          category: string;
          item_name: string;
          description: string;
          target_count: number;
          is_mandatory: boolean;
          sort_order: number;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          specialty: string;
          training_year: string;
          category: string;
          item_name: string;
          description?: string;
          target_count?: number;
          is_mandatory?: boolean;
          sort_order?: number;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          specialty?: string;
          training_year?: string;
          category?: string;
          item_name?: string;
          description?: string;
          target_count?: number;
          is_mandatory?: boolean;
          sort_order?: number;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: never[];
      };
      portfolio_items: {
        Row: {
          id: string;
          user_id: string;
          template_id: string | null;
          specialty: string;
          category: string;
          subcategory: string;
          title: string;
          description: string;
          status: ItemStatus;
          current_count: number;
          target_count: number;
          date_completed: string | null;
          notes: string;
          evidence_urls: string[];
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          template_id?: string | null;
          specialty: string;
          category: string;
          subcategory?: string;
          title: string;
          description?: string;
          status?: ItemStatus;
          current_count?: number;
          target_count?: number;
          date_completed?: string | null;
          notes?: string;
          evidence_urls?: string[];
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          template_id?: string | null;
          specialty?: string;
          category?: string;
          subcategory?: string;
          title?: string;
          description?: string;
          status?: ItemStatus;
          current_count?: number;
          target_count?: number;
          date_completed?: string | null;
          notes?: string;
          evidence_urls?: string[];
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: never[];
      };
      cases: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          date_seen: string;
          specialty_tags: string[];
          presenting_complaint: string;
          key_findings: string;
          diagnosis: string;
          management: string;
          outcome: string;
          learning_points: string;
          reflection: string;
          complexity: CaseComplexity | null;
          custom_tags: string[];
          is_anonymised_confirmed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          date_seen?: string;
          specialty_tags?: string[];
          presenting_complaint?: string;
          key_findings?: string;
          diagnosis?: string;
          management?: string;
          outcome?: string;
          learning_points?: string;
          reflection?: string;
          complexity?: CaseComplexity | null;
          custom_tags?: string[];
          is_anonymised_confirmed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          date_seen?: string;
          specialty_tags?: string[];
          presenting_complaint?: string;
          key_findings?: string;
          diagnosis?: string;
          management?: string;
          outcome?: string;
          learning_points?: string;
          reflection?: string;
          complexity?: CaseComplexity | null;
          custom_tags?: string[];
          is_anonymised_confirmed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: never[];
      };
      uploads: {
        Row: {
          id: string;
          user_id: string;
          portfolio_item_id: string | null;
          case_id: string | null;
          file_name: string;
          file_path: string;
          file_size: number;
          mime_type: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          portfolio_item_id?: string | null;
          case_id?: string | null;
          file_name: string;
          file_path: string;
          file_size?: number;
          mime_type?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          portfolio_item_id?: string | null;
          case_id?: string | null;
          file_name?: string;
          file_path?: string;
          file_size?: number;
          mime_type?: string;
          created_at?: string;
        };
        Relationships: never[];
      };
      reminders: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string;
          due_date: string;
          is_completed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string;
          due_date: string;
          is_completed?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string;
          due_date?: string;
          is_completed?: boolean;
          created_at?: string;
        };
        Relationships: never[];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_user_storage_used: {
        Args: {
          p_user_id: string;
        };
        Returns: number;
      };
    };
  };
}

export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
export type CaseRow = Database['public']['Tables']['cases']['Row'];
export type CaseInsert = Database['public']['Tables']['cases']['Insert'];
export type CaseUpdate = Database['public']['Tables']['cases']['Update'];
export type PortfolioItemRow = Database['public']['Tables']['portfolio_items']['Row'];
export type PortfolioItemInsert = Database['public']['Tables']['portfolio_items']['Insert'];
export type PortfolioItemUpdate = Database['public']['Tables']['portfolio_items']['Update'];
export type UploadRow = Database['public']['Tables']['uploads']['Row'];
