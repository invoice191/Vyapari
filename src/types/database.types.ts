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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      ai_cache: {
        Row: {
          business_id: string | null
          cache_key: string
          content: Json | null
          created_at: string | null
          expires_at: string | null
          id: string
          response: Json | null
          user_id: string | null
        }
        Insert: {
          business_id?: string | null
          cache_key: string
          content?: Json | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          response?: Json | null
          user_id?: string | null
        }
        Update: {
          business_id?: string | null
          cache_key?: string
          content?: Json | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          response?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_cache_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_cache_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "dashboard_summary"
            referencedColumns: ["business_id"]
          },
        ]
      }
      anomaly_log: {
        Row: {
          anomaly_type: string | null
          business_id: string
          description: string | null
          detected_at: string | null
          expected_value: number | null
          id: string
          is_dismissed: boolean | null
          message: string | null
          metadata: Json | null
          module: string | null
          reference_id: string | null
          reference_type: string | null
          resolved: boolean | null
          severity: string | null
          title: string | null
          type: string | null
          value: number | null
          z_score: number | null
        }
        Insert: {
          anomaly_type?: string | null
          business_id?: string
          description?: string | null
          detected_at?: string | null
          expected_value?: number | null
          id?: string
          is_dismissed?: boolean | null
          message?: string | null
          metadata?: Json | null
          module?: string | null
          reference_id?: string | null
          reference_type?: string | null
          resolved?: boolean | null
          severity?: string | null
          title?: string | null
          type?: string | null
          value?: number | null
          z_score?: number | null
        }
        Update: {
          anomaly_type?: string | null
          business_id?: string
          description?: string | null
          detected_at?: string | null
          expected_value?: number | null
          id?: string
          is_dismissed?: boolean | null
          message?: string | null
          metadata?: Json | null
          module?: string | null
          reference_id?: string | null
          reference_type?: string | null
          resolved?: boolean | null
          severity?: string | null
          title?: string | null
          type?: string | null
          value?: number | null
          z_score?: number | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          business_id: string | null
          id: string
          metadata: Json | null
          module: string | null
          severity: string | null
          target: string | null
          timestamp: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          business_id?: string | null
          id?: string
          metadata?: Json | null
          module?: string | null
          severity?: string | null
          target?: string | null
          timestamp?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          business_id?: string | null
          id?: string
          metadata?: Json | null
          module?: string | null
          severity?: string | null
          target?: string | null
          timestamp?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "dashboard_summary"
            referencedColumns: ["business_id"]
          },
        ]
      }
      businesses: {
        Row: {
          address: string | null
          created_at: string | null
          gstin: string | null
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          settings: Json | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          gstin?: string | null
          id?: string
          logo_url?: string | null
          name: string
          phone?: string | null
          settings?: Json | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          gstin?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          settings?: Json | null
        }
        Relationships: []
      }
      cash_flow_forecast: {
        Row: {
          business_id: string | null
          confidence_score: number | null
          forecast_date: string
          generated_at: string | null
          id: string
          projected_inflow: number | null
          projected_outflow: number | null
        }
        Insert: {
          business_id?: string | null
          confidence_score?: number | null
          forecast_date: string
          generated_at?: string | null
          id?: string
          projected_inflow?: number | null
          projected_outflow?: number | null
        }
        Update: {
          business_id?: string | null
          confidence_score?: number | null
          forecast_date?: string
          generated_at?: string | null
          id?: string
          projected_inflow?: number | null
          projected_outflow?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cash_flow_forecast_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_flow_forecast_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "dashboard_summary"
            referencedColumns: ["business_id"]
          },
        ]
      }
      categories: {
        Row: {
          business_id: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          user_id: string | null
        }
        Insert: {
          business_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          user_id?: string | null
        }
        Update: {
          business_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "dashboard_summary"
            referencedColumns: ["business_id"]
          },
        ]
      }
      churn_predictions: {
        Row: {
          churn_probability: number
          churn_risk: string
          contact_id: string
          generated_at: string | null
          id: string
        }
        Insert: {
          churn_probability: number
          churn_risk: string
          contact_id: string
          generated_at?: string | null
          id?: string
        }
        Update: {
          churn_probability?: number
          churn_risk?: string
          contact_id?: string
          generated_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "churn_predictions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: true
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      clv_results: {
        Row: {
          business_id: string
          confidence_score: number | null
          contact_id: string
          last_updated: string | null
          predicted_clv: number | null
          segment: string | null
        }
        Insert: {
          business_id: string
          confidence_score?: number | null
          contact_id: string
          last_updated?: string | null
          predicted_clv?: number | null
          segment?: string | null
        }
        Update: {
          business_id?: string
          confidence_score?: number | null
          contact_id?: string
          last_updated?: string | null
          predicted_clv?: number | null
          segment?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clv_results_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clv_results_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "dashboard_summary"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "clv_results_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_log: {
        Row: {
          business_id: string | null
          channel: string
          created_at: string | null
          id: string
          invoice_id: string | null
          metadata: Json | null
          recipient: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          business_id?: string | null
          channel: string
          created_at?: string | null
          id?: string
          invoice_id?: string | null
          metadata?: Json | null
          recipient?: string | null
          status: string
          user_id?: string | null
        }
        Update: {
          business_id?: string | null
          channel?: string
          created_at?: string | null
          id?: string
          invoice_id?: string | null
          metadata?: Json | null
          recipient?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "communication_log_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_log_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "dashboard_summary"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "communication_log_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          address: string | null
          business_id: string | null
          city: string | null
          clv_estimate: number | null
          clv_tier: string | null
          created_at: string | null
          credit_limit: number | null
          credit_score: number | null
          email: string | null
          gstin: string | null
          id: string
          loyalty_points: number | null
          name: string | null
          payment_terms: string | null
          phone: string | null
          pincode: string | null
          state: string | null
          type: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          business_id?: string | null
          city?: string | null
          clv_estimate?: number | null
          clv_tier?: string | null
          created_at?: string | null
          credit_limit?: number | null
          credit_score?: number | null
          email?: string | null
          gstin?: string | null
          id?: string
          loyalty_points?: number | null
          name?: string | null
          payment_terms?: string | null
          phone?: string | null
          pincode?: string | null
          state?: string | null
          type?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          business_id?: string | null
          city?: string | null
          clv_estimate?: number | null
          clv_tier?: string | null
          created_at?: string | null
          credit_limit?: number | null
          credit_score?: number | null
          email?: string | null
          gstin?: string | null
          id?: string
          loyalty_points?: number | null
          name?: string | null
          payment_terms?: string | null
          phone?: string | null
          pincode?: string | null
          state?: string | null
          type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "dashboard_summary"
            referencedColumns: ["business_id"]
          },
        ]
      }
      demand_forecasts: {
        Row: {
          business_id: string
          forecast_date: string
          generated_at: string | null
          id: string
          lower_bound: number | null
          model: string | null
          predicted_qty: number
          product_id: string
          upper_bound: number | null
        }
        Insert: {
          business_id: string
          forecast_date: string
          generated_at?: string | null
          id?: string
          lower_bound?: number | null
          model?: string | null
          predicted_qty: number
          product_id: string
          upper_bound?: number | null
        }
        Update: {
          business_id?: string
          forecast_date?: string
          generated_at?: string | null
          id?: string
          lower_bound?: number | null
          model?: string | null
          predicted_qty?: number
          product_id?: string
          upper_bound?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "demand_forecasts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          business_id: string | null
          cost_price: number | null
          created_at: string | null
          discount_pct: number | null
          gst_rate: number | null
          id: string
          invoice_id: string | null
          line_profit: number | null
          line_total: number | null
          product_id: string | null
          quantity: number
          total: number | null
          unit_price: number
          user_id: string | null
        }
        Insert: {
          business_id?: string | null
          cost_price?: number | null
          created_at?: string | null
          discount_pct?: number | null
          gst_rate?: number | null
          id?: string
          invoice_id?: string | null
          line_profit?: number | null
          line_total?: number | null
          product_id?: string | null
          quantity: number
          total?: number | null
          unit_price: number
          user_id?: string | null
        }
        Update: {
          business_id?: string | null
          cost_price?: number | null
          created_at?: string | null
          discount_pct?: number | null
          gst_rate?: number | null
          id?: string
          invoice_id?: string | null
          line_profit?: number | null
          line_total?: number | null
          product_id?: string | null
          quantity?: number
          total?: number | null
          unit_price?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "dashboard_summary"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "invoice_items_invoice_id_fkey1"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_payments: {
        Row: {
          amount: number
          business_id: string
          id: string
          invoice_id: string
          notes: string | null
          paid_at: string | null
          payment_mode: string
          payment_reference: string | null
        }
        Insert: {
          amount: number
          business_id: string
          id?: string
          invoice_id: string
          notes?: string | null
          paid_at?: string | null
          payment_mode: string
          payment_reference?: string | null
        }
        Update: {
          amount?: number
          business_id?: string
          id?: string
          invoice_id?: string
          notes?: string | null
          paid_at?: string | null
          payment_mode?: string
          payment_reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_reminders: {
        Row: {
          business_id: string | null
          contact_id: string | null
          created_at: string
          due_date: string
          invoice_id: string
          last_error: string | null
          last_reminder_sent_at: string | null
          next_reminder_at: string | null
          reminder_count: number
          reminder_enabled: boolean
          updated_at: string
        }
        Insert: {
          business_id?: string | null
          contact_id?: string | null
          created_at?: string
          due_date: string
          invoice_id: string
          last_error?: string | null
          last_reminder_sent_at?: string | null
          next_reminder_at?: string | null
          reminder_count?: number
          reminder_enabled?: boolean
          updated_at?: string
        }
        Update: {
          business_id?: string | null
          contact_id?: string | null
          created_at?: string
          due_date?: string
          invoice_id?: string
          last_error?: string | null
          last_reminder_sent_at?: string | null
          next_reminder_at?: string | null
          reminder_count?: number
          reminder_enabled?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_reminders_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_reminders_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "dashboard_summary"
            referencedColumns: ["business_id"]
          },
        ]
      }
      invoice_sequences: {
        Row: {
          business_id: string
          last_number: number | null
          prefix: string | null
          updated_at: string | null
        }
        Insert: {
          business_id: string
          last_number?: number | null
          prefix?: string | null
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          last_number?: number | null
          prefix?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_sequences_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_sequences_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "dashboard_summary"
            referencedColumns: ["business_id"]
          },
        ]
      }
      invoices: {
        Row: {
          ai_risk_score: number | null
          business_id: string | null
          contact_id: string | null
          created_at: string | null
          created_via: string | null
          discount_amt: number | null
          due_date: string | null
          gst_amt: number | null
          id: string
          internal_notes: string | null
          invoice_date: string | null
          invoice_number: string | null
          is_purchase: boolean | null
          is_recurring: boolean | null
          notes: string | null
          partial_paid_amount: number | null
          partial_paid_at: string | null
          payment_method: string | null
          payment_status: string | null
          pdf_url: string | null
          recurrence_interval: string | null
          recurrence_next_date: string | null
          recurrence_parent_id: string | null
          sent_at: string | null
          status: string | null
          subtotal: number | null
          total_amount: number | null
          type: string | null
          user_id: string | null
          viewed_at: string | null
        }
        Insert: {
          ai_risk_score?: number | null
          business_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          created_via?: string | null
          discount_amt?: number | null
          due_date?: string | null
          gst_amt?: number | null
          id?: string
          internal_notes?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          is_purchase?: boolean | null
          is_recurring?: boolean | null
          notes?: string | null
          partial_paid_amount?: number | null
          partial_paid_at?: string | null
          payment_method?: string | null
          payment_status?: string | null
          pdf_url?: string | null
          recurrence_interval?: string | null
          recurrence_next_date?: string | null
          recurrence_parent_id?: string | null
          sent_at?: string | null
          status?: string | null
          subtotal?: number | null
          total_amount?: number | null
          type?: string | null
          user_id?: string | null
          viewed_at?: string | null
        }
        Update: {
          ai_risk_score?: number | null
          business_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          created_via?: string | null
          discount_amt?: number | null
          due_date?: string | null
          gst_amt?: number | null
          id?: string
          internal_notes?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          is_purchase?: boolean | null
          is_recurring?: boolean | null
          notes?: string | null
          partial_paid_amount?: number | null
          partial_paid_at?: string | null
          payment_method?: string | null
          payment_status?: string | null
          pdf_url?: string | null
          recurrence_interval?: string | null
          recurrence_next_date?: string | null
          recurrence_parent_id?: string | null
          sent_at?: string | null
          status?: string | null
          subtotal?: number | null
          total_amount?: number | null
          type?: string | null
          user_id?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "dashboard_summary"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger_entries: {
        Row: {
          amount: number
          business_id: string | null
          contact_id: string | null
          description: string | null
          id: string
          invoice_id: string | null
          timestamp: string | null
          type: string
          user_id: string | null
        }
        Insert: {
          amount: number
          business_id?: string | null
          contact_id?: string | null
          description?: string | null
          id?: string
          invoice_id?: string | null
          timestamp?: string | null
          type: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          business_id?: string | null
          contact_id?: string | null
          description?: string | null
          id?: string
          invoice_id?: string | null
          timestamp?: string | null
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ledger_entries_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledgers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledgers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "dashboard_summary"
            referencedColumns: ["business_id"]
          },
        ]
      }
      loyalty_points: {
        Row: {
          business_id: string | null
          created_at: string | null
          customer_id: string | null
          id: string
          points: number
          transaction_id: string | null
          type: string
          user_id: string | null
        }
        Insert: {
          business_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          id?: string
          points: number
          transaction_id?: string | null
          type: string
          user_id?: string | null
        }
        Update: {
          business_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          id?: string
          points?: number
          transaction_id?: string | null
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_points_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_points_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "dashboard_summary"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "loyalty_points_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_points_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_rules: {
        Row: {
          business_id: string | null
          created_at: string | null
          id: string
          min_redeem_points: number | null
          points_per_rupee: number | null
          user_id: string | null
        }
        Insert: {
          business_id?: string | null
          created_at?: string | null
          id?: string
          min_redeem_points?: number | null
          points_per_rupee?: number | null
          user_id?: string | null
        }
        Update: {
          business_id?: string | null
          created_at?: string | null
          id?: string
          min_redeem_points?: number | null
          points_per_rupee?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_rules_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_rules_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "dashboard_summary"
            referencedColumns: ["business_id"]
          },
        ]
      }
      notification_logs: {
        Row: {
          business_id: string | null
          channel: string
          contact_id: string | null
          id: string
          invoice_id: string | null
          message: string
          phone: string
          provider: string
          provider_response: Json | null
          sent_at: string
          status: string
          user_id: string | null
        }
        Insert: {
          business_id?: string | null
          channel?: string
          contact_id?: string | null
          id?: string
          invoice_id?: string | null
          message: string
          phone: string
          provider?: string
          provider_response?: Json | null
          sent_at?: string
          status?: string
          user_id?: string | null
        }
        Update: {
          business_id?: string | null
          channel?: string
          contact_id?: string | null
          id?: string
          invoice_id?: string | null
          message?: string
          phone?: string
          provider?: string
          provider_response?: Json | null
          sent_at?: string
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_logs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_logs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "dashboard_summary"
            referencedColumns: ["business_id"]
          },
        ]
      }
      product_bundles: {
        Row: {
          antecedent_products: string[]
          business_id: string
          confidence: number | null
          consequent_products: string[]
          generated_at: string | null
          id: string
          lift: number | null
          support: number | null
        }
        Insert: {
          antecedent_products: string[]
          business_id: string
          confidence?: number | null
          consequent_products: string[]
          generated_at?: string | null
          id?: string
          lift?: number | null
          support?: number | null
        }
        Update: {
          antecedent_products?: string[]
          business_id?: string
          confidence?: number | null
          consequent_products?: string[]
          generated_at?: string | null
          id?: string
          lift?: number | null
          support?: number | null
        }
        Relationships: []
      }
      products: {
        Row: {
          business_id: string | null
          category_id: string | null
          cost_price: number
          created_at: string | null
          gst_rate: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          quantity: number | null
          reorder_level: number | null
          reorder_point: number | null
          reorder_qty: number | null
          selling_price: number
          sku: string | null
          supplier_id: string | null
          unit: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          business_id?: string | null
          category_id?: string | null
          cost_price?: number
          created_at?: string | null
          gst_rate?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          quantity?: number | null
          reorder_level?: number | null
          reorder_point?: number | null
          reorder_qty?: number | null
          selling_price?: number
          sku?: string | null
          supplier_id?: string | null
          unit?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          business_id?: string | null
          category_id?: string | null
          cost_price?: number
          created_at?: string | null
          gst_rate?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          quantity?: number | null
          reorder_level?: number | null
          reorder_point?: number | null
          reorder_qty?: number | null
          selling_price?: number
          sku?: string | null
          supplier_id?: string | null
          unit?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "dashboard_summary"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          business_id: string | null
          created_at: string | null
          display_name: string | null
          email: string | null
          full_name: string | null
          id: string
          role: string | null
        }
        Insert: {
          avatar_url?: string | null
          business_id?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          role?: string | null
        }
        Update: {
          avatar_url?: string | null
          business_id?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "dashboard_summary"
            referencedColumns: ["business_id"]
          },
        ]
      }
      purchase_order_items: {
        Row: {
          business_id: string | null
          id: string
          po_id: string | null
          product_id: string | null
          quantity: number
          total: number | null
          unit_cost: number
          user_id: string | null
        }
        Insert: {
          business_id?: string | null
          id?: string
          po_id?: string | null
          product_id?: string | null
          quantity: number
          total?: number | null
          unit_cost: number
          user_id?: string | null
        }
        Update: {
          business_id?: string | null
          id?: string
          po_id?: string | null
          product_id?: string | null
          quantity?: number
          total?: number | null
          unit_cost?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "dashboard_summary"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "purchase_order_items_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          business_id: string | null
          created_at: string | null
          id: string
          notes: string | null
          order_date: string | null
          po_number: string | null
          status: string | null
          supplier_id: string | null
          total_amount: number | null
          user_id: string | null
        }
        Insert: {
          business_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          order_date?: string | null
          po_number?: string | null
          status?: string | null
          supplier_id?: string | null
          total_amount?: number | null
          user_id?: string | null
        }
        Update: {
          business_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          order_date?: string | null
          po_number?: string | null
          status?: string | null
          supplier_id?: string | null
          total_amount?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "dashboard_summary"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_schedule: {
        Row: {
          auto_send_whatsapp: boolean | null
          business_id: string
          created_at: string | null
          id: string
          interval: string
          is_active: boolean | null
          last_run_date: string | null
          next_run_date: string
          template_invoice_id: string
          user_id: string | null
        }
        Insert: {
          auto_send_whatsapp?: boolean | null
          business_id: string
          created_at?: string | null
          id?: string
          interval: string
          is_active?: boolean | null
          last_run_date?: string | null
          next_run_date: string
          template_invoice_id: string
          user_id?: string | null
        }
        Update: {
          auto_send_whatsapp?: boolean | null
          business_id?: string
          created_at?: string | null
          id?: string
          interval?: string
          is_active?: boolean | null
          last_run_date?: string | null
          next_run_date?: string
          template_invoice_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recurring_schedule_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_schedule_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "dashboard_summary"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "recurring_schedule_template_invoice_id_fkey"
            columns: ["template_invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      reminders: {
        Row: {
          business_id: string
          created_at: string | null
          created_by: string | null
          id: string
          message: string
          remind_at: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          business_id: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          message: string
          remind_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          message?: string
          remind_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      restock_suggestions: {
        Row: {
          business_id: string | null
          created_at: string | null
          id: string
          product_id: string | null
          reason: string | null
          status: string | null
          suggested_qty: number
          user_id: string | null
        }
        Insert: {
          business_id?: string | null
          created_at?: string | null
          id?: string
          product_id?: string | null
          reason?: string | null
          status?: string | null
          suggested_qty: number
          user_id?: string | null
        }
        Update: {
          business_id?: string | null
          created_at?: string | null
          id?: string
          product_id?: string | null
          reason?: string | null
          status?: string | null
          suggested_qty?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restock_suggestions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restock_suggestions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "dashboard_summary"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "restock_suggestions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      rfm_results: {
        Row: {
          business_id: string
          calculated_at: string | null
          contact_id: string
          contact_name: string | null
          f_score: number | null
          frequency: number | null
          id: string
          m_score: number | null
          monetary: number | null
          r_score: number | null
          recency_days: number | null
          rfm_segment: string | null
          segment_color: string | null
          segment_label: string | null
        }
        Insert: {
          business_id: string
          calculated_at?: string | null
          contact_id: string
          contact_name?: string | null
          f_score?: number | null
          frequency?: number | null
          id?: string
          m_score?: number | null
          monetary?: number | null
          r_score?: number | null
          recency_days?: number | null
          rfm_segment?: string | null
          segment_color?: string | null
          segment_label?: string | null
        }
        Update: {
          business_id?: string
          calculated_at?: string | null
          contact_id?: string
          contact_name?: string | null
          f_score?: number | null
          frequency?: number | null
          id?: string
          m_score?: number | null
          monetary?: number | null
          r_score?: number | null
          recency_days?: number | null
          rfm_segment?: string | null
          segment_color?: string | null
          segment_label?: string | null
        }
        Relationships: []
      }
      rfm_segments: {
        Row: {
          business_id: string
          contact_id: string
          frequency: number | null
          last_updated: string | null
          monetary_value: number | null
          recency: number | null
          rfm_score: string | null
          segment: string | null
        }
        Insert: {
          business_id: string
          contact_id: string
          frequency?: number | null
          last_updated?: string | null
          monetary_value?: number | null
          recency?: number | null
          rfm_score?: string | null
          segment?: string | null
        }
        Update: {
          business_id?: string
          contact_id?: string
          frequency?: number | null
          last_updated?: string | null
          monetary_value?: number | null
          recency?: number | null
          rfm_score?: string | null
          segment?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rfm_segments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfm_segments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "dashboard_summary"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "rfm_segments_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_filter_presets: {
        Row: {
          business_id: string | null
          created_at: string | null
          description: string | null
          filters: Json
          id: string
          is_shared: boolean | null
          name: string
          report_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          business_id?: string | null
          created_at?: string | null
          description?: string | null
          filters: Json
          id?: string
          is_shared?: boolean | null
          name: string
          report_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          business_id?: string | null
          created_at?: string | null
          description?: string | null
          filters?: Json
          id?: string
          is_shared?: boolean | null
          name?: string
          report_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_filter_presets_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_filter_presets_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "dashboard_summary"
            referencedColumns: ["business_id"]
          },
        ]
      }
      settings: {
        Row: {
          business_id: string | null
          category: string
          created_at: string | null
          data: Json
          id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          business_id?: string | null
          category: string
          created_at?: string | null
          data?: Json
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          business_id?: string | null
          category?: string
          created_at?: string | null
          data?: Json
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "settings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "dashboard_summary"
            referencedColumns: ["business_id"]
          },
        ]
      }
      stock: {
        Row: {
          business_id: string | null
          id: string
          last_updated: string | null
          product_id: string | null
          quantity: number
          user_id: string | null
        }
        Insert: {
          business_id?: string | null
          id?: string
          last_updated?: string | null
          product_id?: string | null
          quantity?: number
          user_id?: string | null
        }
        Update: {
          business_id?: string | null
          id?: string
          last_updated?: string | null
          product_id?: string | null
          quantity?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "dashboard_summary"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "stock_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_logs: {
        Row: {
          id: string
          item_id: string | null
          new_stock: number
          previous_stock: number
          quantity: number
          reason: string | null
          timestamp: string | null
          type: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          item_id?: string | null
          new_stock: number
          previous_stock: number
          quantity: number
          reason?: string | null
          timestamp?: string | null
          type?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          item_id?: string | null
          new_stock?: number
          previous_stock?: number
          quantity?: number
          reason?: string | null
          timestamp?: string | null
          type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_logs_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          business_id: string | null
          created_at: string | null
          id: string
          movement_type: string
          notes: string | null
          product_id: string | null
          quantity_change: number
          reference_id: string | null
          user_id: string | null
        }
        Insert: {
          business_id?: string | null
          created_at?: string | null
          id?: string
          movement_type: string
          notes?: string | null
          product_id?: string | null
          quantity_change: number
          reference_id?: string | null
          user_id?: string | null
        }
        Update: {
          business_id?: string | null
          created_at?: string | null
          id?: string
          movement_type?: string
          notes?: string | null
          product_id?: string | null
          quantity_change?: number
          reference_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "dashboard_summary"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_velocity: {
        Row: {
          avg_daily_sales: number | null
          business_id: string
          days_until_stockout: number | null
          product_id: string
          updated_at: string | null
          urgency: string | null
          velocity_trend: string | null
        }
        Insert: {
          avg_daily_sales?: number | null
          business_id: string
          days_until_stockout?: number | null
          product_id: string
          updated_at?: string | null
          urgency?: string | null
          velocity_trend?: string | null
        }
        Update: {
          avg_daily_sales?: number | null
          business_id?: string
          days_until_stockout?: number | null
          product_id?: string
          updated_at?: string | null
          urgency?: string | null
          velocity_trend?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_velocity_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_velocity_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "dashboard_summary"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "stock_velocity_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      vani_logs: {
        Row: {
          business_id: string
          confidence: number | null
          created_at: string | null
          execution_time_ms: number | null
          id: string
          intent: string | null
          language_detected: string | null
          response_spoken: string | null
          transcript: string
          user_id: string | null
          was_confirmed: boolean | null
          was_executed: boolean | null
        }
        Insert: {
          business_id: string
          confidence?: number | null
          created_at?: string | null
          execution_time_ms?: number | null
          id?: string
          intent?: string | null
          language_detected?: string | null
          response_spoken?: string | null
          transcript: string
          user_id?: string | null
          was_confirmed?: boolean | null
          was_executed?: boolean | null
        }
        Update: {
          business_id?: string
          confidence?: number | null
          created_at?: string | null
          execution_time_ms?: number | null
          id?: string
          intent?: string | null
          language_detected?: string | null
          response_spoken?: string | null
          transcript?: string
          user_id?: string | null
          was_confirmed?: boolean | null
          was_executed?: boolean | null
        }
        Relationships: []
      }
    }
    Views: {
      dashboard_summary: {
        Row: {
          active_invoices_count: number | null
          business_id: string | null
          low_stock_count: number | null
          overdue_count: number | null
          today_revenue: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_clv: {
        Args: { p_business_id: string }
        Returns: {
          avg_value: number
          clv_estimate: number
          clv_tier: string
          contact_id: string
          contact_name: string
          frequency: number
          lifespan: number
        }[]
      }
      calculate_contact_balance: {
        Args: { p_contact_id: string }
        Returns: number
      }
      calculate_contact_balance_v2: {
        Args: { p_business_id: string; p_contact_id: string }
        Returns: number
      }
      calculate_rfm: {
        Args: { p_business_id: string }
        Returns: {
          contact_id: string
          contact_name: string
          f_score: number
          frequency: number
          m_score: number
          monetary: number
          r_score: number
          recency_days: number
          rfm_segment: string
          segment_color: string
          segment_label: string
        }[]
      }
      calculate_stock_velocity: {
        Args: { p_business_id: string }
        Returns: {
          avg_daily_sales: number
          current_stock: number
          days_until_stockout: number
          product_id: string
          product_name: string
          urgency: string
          velocity_trend: string
        }[]
      }
      check_duplicate_invoice: {
        Args: {
          p_business_id: string
          p_contact_id: string
          p_total_amount: number
        }
        Returns: {
          created_at: string
          id: string
          invoice_number: string
        }[]
      }
      create_invoice_v2: {
        Args: {
          p_invoice: Json
          p_items: Json[]
          p_ledger?: Json
          p_sale: Json
        }
        Returns: Json
      }
      create_invoice_v4: {
        Args: { p_invoice: Json; p_items: Json[] }
        Returns: Json
      }
      create_invoice_v6: {
        Args: { p_invoice: Json; p_items: Json }
        Returns: Json
      }
      detect_anomalies: {
        Args: { p_business_id: string }
        Returns: {
          anomaly_type: string
          description: string
          detected_at: string
          expected_value: number
          reference_id: string
          reference_type: string
          severity: string
          value: number
          z_score: number
        }[]
      }
      dss_category_breakdown: {
        Args: { p_days?: number }
        Returns: {
          category: string
          margin_pct: number
          pct_of_total: number
          profit: number
          revenue: number
        }[]
      }
      dss_daily_trend: {
        Args: { p_category?: string; p_days?: number }
        Returns: {
          day: string
          orders: number
          profit: number
          revenue: number
        }[]
      }
      dss_kpis: {
        Args: { p_category?: string; p_days?: number }
        Returns: Json
      }
      dss_product_ranking: {
        Args: { p_days?: number; p_limit?: number; p_order?: string }
        Returns: {
          category: string
          margin_pct: number
          product_id: string
          product_name: string
          profit: number
          revenue: number
          units_sold: number
        }[]
      }
      dss_stock_health: {
        Args: never
        Returns: {
          category: string
          current_stock: number
          daily_velocity: number
          days_of_supply: number
          product_id: string
          product_name: string
          reorder_point: number
          reorder_qty: number
          stock_level: string
        }[]
      }
      execute_filtered_query: {
        Args: { query_params: Json; query_text: string }
        Returns: Json[]
      }
      extract_churn_features: {
        Args: { p_business_id: string }
        Returns: {
          avg_order_value: number
          contact_id: string
          days_since_last_purchase: number
          is_churned: boolean
          purchase_count_last_90d: number
          purchase_count_prev_90d: number
          total_spent: number
        }[]
      }
      generate_cash_forecast: {
        Args: { p_business_id: string }
        Returns: undefined
      }
      generate_cashflow_forecast: {
        Args: { p_business_id: string }
        Returns: {
          confidence: number
          forecast_date: string
          net_cashflow: number
          projected_inflow: number
          projected_outflow: number
        }[]
      }
      get_auth_business_id: { Args: never; Returns: string }
      get_auth_business_id_v2: { Args: never; Returns: string }
      get_consolidated_analytics: {
        Args: { p_business_id: string }
        Returns: Json
      }
      get_customer_credit_status: {
        Args: { p_business_id: string; p_contact_id: string }
        Returns: {
          avg_payment_days: number
          credit_limit: number
          last_invoice_date: string
          reliability_score: number
          total_outstanding: number
        }[]
      }
      get_daily_sales_summary: {
        Args: {
          p_business_id: string
          p_from: string
          p_group_by?: string
          p_include_cancelled?: boolean
          p_to: string
        }
        Returns: {
          avg_order_value: number
          invoice_count: number
          net_revenue: number
          period: string
          total_discount: number
          total_revenue: number
          total_tax: number
        }[]
      }
      get_dashboard_summary: { Args: { p_business_id: string }; Returns: Json }
      get_dead_stock: {
        Args: {
          p_business_id: string
          p_min_stock_value?: number
          p_no_movement_days?: number
        }
        Returns: {
          category: string
          current_stock: number
          days_without_sale: number
          last_sale_date: string
          product_name: string
          stock_value: number
          supplier_name: string
        }[]
      }
      get_gst_summary: {
        Args: { p_business_id: string; p_from: string; p_to: string }
        Returns: {
          b2b_amount: number
          b2c_amount: number
          invoice_count: number
          tax_collected: number
          tax_rate: number
          taxable_amount: number
        }[]
      }
      get_hourly_sales: {
        Args: { p_business_id: string; p_date: string }
        Returns: {
          hour_label: string
          invoice_count: number
          revenue: number
        }[]
      }
      get_inventory_valuation: {
        Args: { p_business_id: string }
        Returns: {
          category: string
          percentage_of_total: number
          product_count: number
          total_units: number
          total_value: number
        }[]
      }
      get_last_invoice_template: {
        Args: { p_business_id: string; p_contact_id: string }
        Returns: {
          product_id: string
          product_name: string
          quantity: number
          tax_rate: number
          unit: string
          unit_price: number
        }[]
      }
      get_low_stock_report: {
        Args: {
          p_below_reorder_only?: boolean
          p_business_id: string
          p_urgency?: string[]
        }
        Returns: {
          category: string
          current_stock: number
          days_until_stockout: number
          product_name: string
          reorder_level: number
          sku: string
          stock_value: number
          supplier_name: string
          urgency: string
        }[]
      }
      get_my_business_id: { Args: never; Returns: string }
      get_my_role: { Args: never; Returns: string }
      get_next_invoice_number: {
        Args: { p_business_id: string }
        Returns: string
      }
      get_payment_mode_analysis: {
        Args: { p_business_id: string; p_from: string; p_to: string }
        Returns: {
          invoice_count: number
          payment_mode: string
          percentage: number
          total_amount: number
        }[]
      }
      get_pl_statement: {
        Args: { p_business_id: string; p_from: string; p_to: string }
        Returns: {
          amount: number
          category: string
          line_item: string
          sort_order: number
        }[]
      }
      get_product_daily_sales: {
        Args: { p_days: number; p_product_id: string }
        Returns: {
          qty_sold: number
          sale_date: string
        }[]
      }
      get_sales_by_employee: {
        Args: { p_business_id: string; p_from: string; p_to: string }
        Returns: {
          avg_order_value: number
          employee_name: string
          invoice_count: number
          total_revenue: number
        }[]
      }
      get_supplier_performance: {
        Args: { p_business_id: string; p_from: string; p_to: string }
        Returns: {
          avg_order_value: number
          last_order_date: string
          supplier_name: string
          total_orders: number
          total_value: number
        }[]
      }
      get_upsell_suggestions: {
        Args: {
          p_business_id: string
          p_contact_id: string
          p_current_product_ids: string[]
          p_limit?: number
        }
        Returns: {
          co_purchase_rate: number
          product_id: string
          product_name: string
          reason: string
          unit_price: number
        }[]
      }
      record_payment_v1: {
        Args: {
          p_amount: number
          p_business_id: string
          p_date: string
          p_invoice_id: string
          p_mode: string
          p_notes: string
          p_ref: string
        }
        Returns: undefined
      }
      refresh_bi_materialized_views: { Args: never; Returns: undefined }
      refresh_rfm_for_business: {
        Args: { p_business_id: string }
        Returns: undefined
      }
      refresh_stock_velocity: {
        Args: { p_business_id: string }
        Returns: undefined
      }
      search_products_smart: {
        Args: { p_business_id: string; p_query: string }
        Returns: {
          frequency: number
          id: string
          name: string
          reorder_level: number
          selling_price: number
          stock: number
        }[]
      }
      sync_all_analytics: { Args: never; Returns: undefined }
      sync_anomalies: { Args: { p_business_id: string }; Returns: undefined }
      sync_clv_results: { Args: { p_business_id: string }; Returns: undefined }
      update_loyalty_points:
        | {
            Args: { p_contact_id: string; p_points: number }
            Returns: undefined
          }
        | {
            Args: { p_contact_id: string; p_points: number }
            Returns: undefined
          }
      update_stock_with_log: {
        Args: {
          p_change: number
          p_item_id: string
          p_reason: string
          p_type: string
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
