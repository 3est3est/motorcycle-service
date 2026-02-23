import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ป่าโยว์เย่ การช่าง | ระบบจัดการร้านซ่อมรถจักรยานยนต์",
    template: "%s | ป่าโยว์เย่ การช่าง",
  },
  description:
    "ระบบบริหารจัดการร้านซ่อมรถจักรยานยนต์ครบวงจร จองคิวซ่อม ติดตามงานซ่อม ดูใบเสนอราคา ชำระเงิน และสะสมคะแนน",
  keywords: ["ร้านซ่อมรถ", "มอเตอร์ไซค์", "จองคิวซ่อม", "ซ่อมรถ"],
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className="antialiased">{children}</body>
    </html>
  );
}
