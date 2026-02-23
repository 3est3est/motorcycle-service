import { z } from "zod";

// Auth
export const loginSchema = z.object({
  email: z.string().email("รูปแบบอีเมลไม่ถูกต้อง"),
  password: z.string().min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร"),
});

export const registerSchema = z
  .object({
    email: z.string().email("รูปแบบอีเมลไม่ถูกต้อง"),
    password: z
      .string()
      .min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร")
      .regex(
        /^(?=.*[a-zA-Z])(?=.*[0-9])/,
        "รหัสผ่านต้องมีทั้งตัวอักษรและตัวเลข",
      ),
    confirmPassword: z.string().min(1, "กรุณายืนยันรหัสผ่าน"),
    full_name: z.string().min(1, "กรุณากรอกชื่อ-นามสกุล").max(255),
    phone: z
      .string()
      .regex(/^[0-9]{9,10}$/, "เบอร์โทรต้องเป็นตัวเลข 9-10 หลัก"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "รหัสผ่านไม่ตรงกัน",
    path: ["confirmPassword"],
  });

// Motorcycle
export const motorcycleSchema = z.object({
  brand: z.string().min(1, "กรุณากรอกยี่ห้อรถ").max(255),
  model: z.string().min(1, "กรุณากรอกรุ่นรถ").max(255),
  license_plate: z.string().min(1, "กรุณากรอกทะเบียนรถ").max(20),
  year: z.number().int().min(1900).max(2100).optional(),
});

// Booking
export const bookingSchema = z.object({
  motorcycle_id: z.string().uuid("รหัสรถไม่ถูกต้อง"),
  booking_time: z.string().min(1, "กรุณาเลือกวันและเวลา"),
  symptom_note: z.string().max(1000).optional(),
});

// Estimate
export const estimateSchema = z.object({
  booking_id: z.string().uuid(),
  description: z.string().min(1, "กรุณากรอกรายละเอียด"),
  estimated_cost: z.number().min(0, "ราคาต้องไม่ติดลบ"),
});

// Quotation
export const quotationItemSchema = z.object({
  description: z.string().min(1),
  labor: z.number().min(0),
  part_id: z.string().uuid().optional(),
  part_qty: z.number().int().min(1).optional(),
});

export const quotationSchema = z.object({
  booking_id: z.string().uuid(),
  items: z.array(quotationItemSchema).min(1, "ต้องมีรายการอย่างน้อย 1 รายการ"),
});

// Payment
export const paymentSchema = z.object({
  repair_job_id: z.string().uuid(),
  amount: z.number().positive("จำนวนเงินต้องมากกว่า 0"),
  method: z.enum(["CASH", "TRANSFER", "QR_TRANSFER"]),
});

// Part
export const partSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่ออะไหล่").max(255),
  description: z.string().max(500).optional(),
  price: z.number().min(0, "ราคาต้องไม่ติดลบ"),
  stock_qty: z.number().int().min(0, "จำนวนต้องไม่ติดลบ"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type MotorcycleInput = z.infer<typeof motorcycleSchema>;
export type BookingInput = z.infer<typeof bookingSchema>;
export type EstimateInput = z.infer<typeof estimateSchema>;
export type QuotationInput = z.infer<typeof quotationSchema>;
export type PaymentInput = z.infer<typeof paymentSchema>;
export type PartInput = z.infer<typeof partSchema>;
