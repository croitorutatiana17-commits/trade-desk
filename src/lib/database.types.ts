export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type JobStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue'

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
          total: number
          sort_order: number
        }
        Insert: Omit<Database['public']['Tables']['invoice_line_items']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['invoice_line_items']['Insert']>
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
