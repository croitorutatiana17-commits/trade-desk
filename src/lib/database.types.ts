export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type JobStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue'
export type InvoicePaymentStatus =
  | 'checkout_created'
  | 'processing'
  | 'paid'
  | 'failed'
  | 'refunded'
  | 'cancelled'
export type SubscriptionStatus =
  | 'incomplete'
  | 'incomplete_expired'
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'paused'

export interface Database {
  public: {
    Tables: {
      customers: {
        Row: {
          id: string
          user_id: string
          name: string
          email: string | null
          phone: string | null
          address: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['customers']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['customers']['Insert']>
      }
      jobs: {
        Row: {
          id: string
          user_id: string
          customer_id: string | null
          title: string
          category: string | null
          description: string | null
          status: JobStatus
          scheduled_date: string | null
          scheduled_time: string | null
          price: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['jobs']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['jobs']['Insert']>
      }
      invoices: {
        Row: {
          id: string
          share_token: string
          user_id: string
          customer_id: string | null
          job_id: string | null
          invoice_number: string
          status: InvoiceStatus
          subtotal: number
          tax_rate: number
          tax_amount: number
          total: number
          issue_date: string
          due_date: string
          paid_at: string | null
          invoice_sent_at: string | null
          invoice_last_sent_at: string | null
          invoice_send_count: number
          receipt_sent_at: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['invoices']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['invoices']['Insert']>
      }
      invoice_line_items: {
        Row: {
          id: string
          invoice_id: string
          description: string
          quantity: number
          unit_price: number
          sort_order: number
        }
        Insert: Omit<Database['public']['Tables']['invoice_line_items']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['invoice_line_items']['Insert']>
      }
      invoice_payments: {
        Row: {
          id: string
          invoice_id: string
          user_id: string
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          stripe_event_id: string | null
          amount: number
          currency: string
          status: InvoicePaymentStatus
          paid_at: string | null
          raw_event: Json | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['invoice_payments']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['invoice_payments']['Insert']>
      }
      invoice_email_events: {
        Row: {
          id: string
          invoice_id: string
          user_id: string
          customer_email: string
          email_type: 'invoice' | 'receipt'
          status: 'sent' | 'failed'
          resend_email_id: string | null
          error_message: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['invoice_email_events']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['invoice_email_events']['Insert']>
      }
      user_subscriptions: {
        Row: {
          user_id: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          status: SubscriptionStatus
          current_period_end: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['user_subscriptions']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['user_subscriptions']['Insert']>
      }
      job_photos: {
        Row: {
          id: string
          job_id: string
          user_id: string
          storage_path: string
          caption: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['job_photos']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['job_photos']['Insert']>
      }
    }
  }
}

// Convenience row types
export type CustomerRow = Database['public']['Tables']['customers']['Row']
export type JobRow = Database['public']['Tables']['jobs']['Row']
export type InvoiceRow = Database['public']['Tables']['invoices']['Row']
export type InvoiceLineItemRow = Database['public']['Tables']['invoice_line_items']['Row']
export type InvoicePaymentRow = Database['public']['Tables']['invoice_payments']['Row']
export type InvoiceEmailEventRow = Database['public']['Tables']['invoice_email_events']['Row']
export type UserSubscriptionRow = Database['public']['Tables']['user_subscriptions']['Row']
export type JobPhotoRow = Database['public']['Tables']['job_photos']['Row']

// Joined types used in the UI
export type JobWithCustomer = JobRow & { customers: Pick<CustomerRow, 'id' | 'name'> | null }
export type InvoiceWithCustomer = InvoiceRow & {
  customers: Pick<CustomerRow, 'id' | 'name'> | null
  invoice_line_items: InvoiceLineItemRow[]
}
export type CustomerWithStats = CustomerRow & {
  job_count: number
  total_revenue: number
  outstanding: number
}
