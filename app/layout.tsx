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
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#3b82f6",
};

import { cookies } from "next/headers";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const theme = cookieStore.get("theme")?.value || "light";

  return (
    <html lang="th" className={theme === "dark" ? "dark" : ""}>
      <body className="antialiased min-h-screen bg-background">{children}</body>
    </html>
  );
}
