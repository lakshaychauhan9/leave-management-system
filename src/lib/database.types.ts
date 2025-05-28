export type Database = {
  public: {
    Tables: {
      auth_users: {
        Row: {
          created_at: string | null;
          email: string;
          failed_attempts: number | null;
          id: string;
          is_active: boolean | null;
          last_password_change: string | null;
          role: string;
        };
        Insert: {
          created_at?: string | null;
          email: string;
          failed_attempts?: number | null;
          id?: string;
          is_active?: boolean | null;
          last_password_change?: string | null;
          role: string;
        };
        Update: {
          created_at?: string | null;
          email?: string;
          failed_attempts?: number | null;
          id?: string;
          is_active?: boolean | null;
          last_password_change?: string | null;
          role?: string;
        };
      };
      employee_leave_types: {
        Row: {
          created_at: string | null;
          employee_id: string;
          id: string;
          is_eligible: boolean | null;
          leave_type_id: string;
        };
        Insert: {
          created_at?: string | null;
          employee_id: string;
          id?: string;
          is_eligible?: boolean | null;
          leave_type_id: string;
        };
        Update: {
          created_at?: string | null;
          employee_id?: string;
          id?: string;
          is_eligible?: boolean | null;
          leave_type_id?: string;
        };
      };
      holidays: {
        Row: {
          created_at: string | null;
          date: string;
          name: string;
        };
        Insert: {
          created_at?: string | null;
          date: string;
          name: string;
        };
        Update: {
          created_at?: string | null;
          date?: string;
          name?: string;
        };
      };
      leave_type_requests: {
        Row: {
          admin_feedback: string | null;
          created_at: string | null;
          employee_id: string;
          id: string;
          leave_type_id: string;
          status: string;
          updated_at: string | null;
        };
        Insert: {
          admin_feedback?: string | null;
          created_at?: string | null;
          employee_id: string;
          id?: string;
          leave_type_id: string;
          status: string;
          updated_at?: string | null;
        };
        Update: {
          admin_feedback?: string | null;
          created_at?: string | null;
          employee_id?: string;
          id?: string;
          leave_type_id?: string;
          status?: string;
          updated_at?: string | null;
        };
      };
      leave_types: {
        Row: {
          created_at: string | null;
          default_total: number | null;
          id: string;
          name: string;
        };
        Insert: {
          created_at?: string | null;
          default_total?: number | null;
          id?: string;
          name: string;
        };
        Update: {
          created_at?: string | null;
          default_total?: number | null;
          id?: string;
          name?: string;
        };
      };
      leaves: {
        Row: {
          created_at: string | null;
          leave_type_id: string;
          remaining: number;
          taken: number | null;
          total: number;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          leave_type_id: string;
          remaining: number;
          taken?: number | null;
          total: number;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          leave_type_id?: string;
          remaining?: number;
          taken?: number | null;
          total?: number;
          updated_at?: string | null;
          user_id?: string;
        };
      };
      notifications: {
        Row: {
          created_at: string | null;
          id: string;
          message: string;
          read: boolean | null;
          type: string;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          message: string;
          read?: boolean | null;
          type: string;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          message?: string;
          read?: boolean | null;
          type?: string;
          user_id?: string;
        };
      };
      requests: {
        Row: {
          created_at: string | null;
          end_date: string;
          file_url: string | null;
          id: string;
          leave_type_id: string;
          manager_feedback: string | null;
          message: string | null;
          start_date: string;
          status: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          end_date: string;
          file_url?: string | null;
          id?: string;
          leave_type_id: string;
          manager_feedback?: string | null;
          message?: string | null;
          start_date: string;
          status: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          end_date?: string;
          file_url?: string | null;
          id?: string;
          leave_type_id?: string;
          manager_feedback?: string | null;
          message?: string | null;
          start_date?: string;
          status?: string;
          updated_at?: string | null;
          user_id?: string;
        };
      };
      user_details: {
        Row: {
          created_at: string | null;
          department: string | null;
          gender: string | null;
          id: string;
          join_date: string;
          nationality: string | null;
        };
        Insert: {
          created_at?: string | null;
          department?: string | null;
          gender?: string | null;
          id?: string;
          join_date: string;
          nationality?: string | null;
        };
        Update: {
          created_at?: string | null;
          department?: string | null;
          gender?: string | null;
          id?: string;
          join_date?: string;
          nationality?: string | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};
