import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export const bookingStatusLabel: Record<string, string> = {
  pending: "รอยืนยัน",
  confirmed: "ยืนยันแล้ว",
  cancelled: "ยกเลิก",
  completed: "เสร็จสิ้น",
};

export const repairJobStatusLabel: Record<string, string> = {
  created: "สร้างแล้ว",
  in_progress: "กำลังซ่อม",
  completed: "ซ่อมเสร็จ",
  delivered: "ส่งมอบแล้ว",
};

export const paymentMethodLabel: Record<string, string> = {
  CASH: "เงินสด",
  TRANSFER: "โอนเงิน",
  QR_TRANSFER: "QR Code",
};
