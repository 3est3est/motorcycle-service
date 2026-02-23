import { TopBar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Phone, Mail, Shield, Bike } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ตั้งค่าบัญชี",
};

export default function ProfilePage() {
  return (
    <div className="animate-fade-in">
      <TopBar title="ตั้งค่าบัญชี" subtitle="จัดการข้อมูลโปรไฟล์ของคุณ" />
      <div className="p-4 sm:p-6 space-y-6 max-w-2xl">
        {/* Profile info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="w-4 h-4 text-primary" />
              ข้อมูลส่วนตัว
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">ล</span>
              </div>
              <div>
                <p className="font-semibold text-foreground">ลูกค้าทดสอบ</p>
                <p className="text-sm text-muted-foreground">ลูกค้า</p>
              </div>
            </div>

            <Input
              id="profile-name"
              label="ชื่อ-นามสกุล"
              defaultValue="ลูกค้าทดสอบ"
              placeholder="ชื่อ-นามสกุล"
            />
            <Input
              id="profile-phone"
              label="เบอร์โทรศัพท์"
              defaultValue="0812345678"
              type="tel"
              placeholder="เบอร์โทร"
            />
            <Input
              id="profile-email"
              label="อีเมล"
              defaultValue="test@example.com"
              type="email"
              placeholder="อีเมล"
              disabled
            />
            <p className="text-xs text-muted-foreground">
              * อีเมลไม่สามารถเปลี่ยนแปลงได้
            </p>

            <Button className="w-full sm:w-auto" id="save-profile-btn">
              บันทึกข้อมูล
            </Button>
          </CardContent>
        </Card>

        {/* Change password */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="w-4 h-4 text-primary" />
              เปลี่ยนรหัสผ่าน
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              id="current-password"
              label="รหัสผ่านปัจจุบัน"
              type="password"
              placeholder="รหัสผ่านปัจจุบัน"
            />
            <Input
              id="new-password"
              label="รหัสผ่านใหม่"
              type="password"
              placeholder="อย่างน้อย 8 ตัว มีตัวอักษรและเลข"
            />
            <Input
              id="confirm-password"
              label="ยืนยันรหัสผ่านใหม่"
              type="password"
              placeholder="ยืนยันรหัสผ่านใหม่"
            />
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              id="change-password-btn"
            >
              เปลี่ยนรหัสผ่าน
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
