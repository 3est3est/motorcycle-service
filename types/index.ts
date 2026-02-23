export type UserRole = "customer" | "staff" | "admin";

export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";

export type RepairJobStatus =
  | "created"
  | "in_progress"
  | "completed"
  | "delivered";

export type PaymentMethod = "CASH" | "TRANSFER" | "QR_TRANSFER";

export type QuotationStatus =
  | "pending_customer_approval"
  | "approved"
  | "rejected";

// User & Auth
export interface User {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface Customer {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  created_at: string;
  user?: User;
  motorcycles?: Motorcycle[];
  loyalty_points?: LoyaltyPoints;
}

// Motorcycle
export interface Motorcycle {
  id: string;
  customer_id: string;
  brand: string;
  model: string;
  license_plate: string;
  year?: number;
  customer?: Customer;
}

// Booking
export interface Booking {
  id: string;
  customer_id: string;
  motorcycle_id: string;
  booking_time: string;
  symptom_note?: string;
  status: BookingStatus;
  created_at: string;
  customer?: Customer;
  motorcycle?: Motorcycle;
  repair_job?: RepairJob;
}

// Estimate
export interface Estimate {
  id: string;
  booking_id: string;
  description: string;
  estimated_cost: number;
  created_at: string;
  booking?: Booking;
}

// Quotation
export interface QuotationItem {
  description: string;
  labor: number;
  part_id?: string;
  part_qty?: number;
  part?: Part;
}

export interface Quotation {
  id: string;
  booking_id: string;
  items: QuotationItem[];
  total_amount: number;
  status: QuotationStatus;
  created_at: string;
  booking?: Booking;
}

// Repair Job
export interface RepairJob {
  id: string;
  booking_id: string;
  quotation_id?: string;
  assigned_staff_id?: string;
  start_date?: string;
  end_date?: string;
  labor_cost: number;
  status: RepairJobStatus;
  created_at: string;
  booking?: Booking;
  parts_used?: RepairPart[];
  payments?: Payment[];
}

// Parts
export interface Part {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock_qty: number;
  created_at: string;
}

export interface RepairPart {
  id: string;
  repair_job_id: string;
  part_id: string;
  quantity: number;
  part?: Part;
}

// Payment
export interface Payment {
  id: string;
  repair_job_id: string;
  amount: number;
  method: PaymentMethod;
  status: "pending" | "success" | "failed";
  paid_at?: string;
  created_at: string;
}

// Loyalty Points
export interface LoyaltyPoints {
  id: string;
  customer_id: string;
  total_points: number;
  updated_at: string;
}

export interface PointTransaction {
  id: string;
  loyalty_points_id: string;
  payment_id?: string;
  event_type: "earn" | "redeem" | "adjust";
  points: number;
  created_at: string;
}

// API Response
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
