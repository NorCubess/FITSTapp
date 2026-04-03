export interface Member {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  created_at: string; // timestamptz
}

export interface Membership {
  id: string;
  member_id: string;
  type: string;
  start_date: string; // date
  end_date?: string;  // date
  sessions_remaining?: number;
  status: 'active' | 'expired';
}

export interface Attendance {
  id: string;
  member_id: string;
  scanned_at: string; // timestamptz
  method: 'qr' | 'manual';
}

export interface Product {
  id: string;
  name: string;
  price: number;
  stock_quantity: number;
  category?: string;
}

export interface Transaction {
  id: string;
  type: 'membership' | 'product';
  items: Record<string, any>; // jsonb
  total_amount: number;
  payment_method: string;
  created_at: string; // timestamptz
}