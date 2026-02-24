"use client";

import { useEffect, useState } from "react";
import { TopBar } from "@/components/layout/topbar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  ShieldCheck,
  Wrench,
  User as UserIcon,
  Loader2,
  Search,
  MoreVertical,
  Check,
  UserPlus,
  Mail,
  Phone,
  Copy,
  Key,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { th } from "date-fns/locale";

interface UserProfile {
  id: string;
  email: string;
  role: "customer" | "staff" | "admin";
  created_at: string;
  customer?: {
    full_name: string;
    phone: string;
  };
}

export default function UsersManagementPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        setCurrentUserRole(data.role);
      }
    } catch (err) {
      console.error("Failed to fetch profile", err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchUsers();
  }, []);

  const handleUpdateRole = async (userId: string, newRole: string) => {
    setUpdatingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (res.ok) {
        fetchUsers();
      } else {
        alert("ไม่สามารถเปลี่ยนสิทธิ์ได้");
      }
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setUpdatingId(null);
    }
  };

  const roleConfig = {
    admin: {
      label: "ผู้ดูแลระบบ",
      color: "bg-destructive/10 text-destructive border-destructive/20",
      icon: ShieldCheck,
    },
    staff: {
      label: "ช่างซ่อม/พนักงาน",
      color: "bg-primary/10 text-primary border-primary/20",
      icon: Wrench,
    },
    customer: {
      label: "ลูกค้า",
      color: "bg-success/10 text-success border-success/20",
      icon: UserIcon,
    },
  };

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.customer?.full_name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="animate-fade-in pb-10">
      <TopBar
        title="จัดการผู้ใช้งาน"
        subtitle="ตรวจสอบและกำหนดสิทธิ์การเข้าถึงระบบสำหรับพนักงานและลูกค้า"
      />

      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96 order-2 sm:order-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="ค้นหาชื่อ หรือ อีเมล..."
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-border bg-background focus:ring-4 focus:ring-primary/10 outline-none transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto order-1 sm:order-2">
            {currentUserRole === "admin" && (
              <AddUserModal onSuccess={fetchUsers} />
            )}
            <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest bg-secondary/30 px-4 py-3 rounded-2xl border border-border/50">
              <Users className="w-4 h-4" />
              {users.length} Users
            </div>
          </div>
        </div>

        <Card className="border-border/50 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            {loading ? (
              <div className="py-20 flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  กำลังโหลดรายชื่อผู้ใช้...
                </p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-20 text-center text-muted-foreground">
                <p>ไม่พบรายชื่อผู้ใช้งาน</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border/50">
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        ผู้ใช้งาน
                      </th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        สิทธิ์การใช้งาน
                      </th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        วันที่เข้าร่วม
                      </th>
                      {currentUserRole === "admin" && (
                        <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          จัดการ
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {filteredUsers.map((u) => {
                      const cfg = roleConfig[u.role];
                      const RoleIcon = cfg.icon;
                      return (
                        <tr
                          key={u.id}
                          className="hover:bg-muted/10 transition-colors group"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                                {u.customer?.full_name?.[0].toUpperCase() ||
                                  u.email[0].toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-foreground truncate">
                                  {u.customer?.full_name || "ไม่มีชื่อ"}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {u.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Badge
                              className={`gap-1.5 py-1 px-3 ${cfg.color} border shadow-none font-medium`}
                            >
                              <RoleIcon className="w-3.5 h-3.5" />
                              {cfg.label}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {format(new Date(u.created_at), "d MMM yyyy", {
                              locale: th,
                            })}
                          </td>
                          {currentUserRole === "admin" && (
                            <td className="px-6 py-4 text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    disabled={updatingId === u.id}
                                  >
                                    {updatingId === u.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <MoreVertical className="w-4 h-4" />
                                    )}
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="w-48 rounded-xl"
                                >
                                  <DropdownMenuLabel>
                                    กำหนดสิทธิ์ใหม่
                                  </DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleUpdateRole(u.id, "customer")
                                    }
                                    className="gap-2"
                                  >
                                    <UserIcon className="w-4 h-4 text-success" />{" "}
                                    เป็นลูกค้า
                                    {u.role === "customer" && (
                                      <Check className="w-3 h-3 ml-auto" />
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleUpdateRole(u.id, "staff")
                                    }
                                    className="gap-2"
                                  >
                                    <Wrench className="w-4 h-4 text-primary" />{" "}
                                    เป็นช่าง/พนักงาน
                                    {u.role === "staff" && (
                                      <Check className="w-3 h-3 ml-auto" />
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleUpdateRole(u.id, "admin")
                                    }
                                    className="gap-2"
                                  >
                                    <ShieldCheck className="w-4 h-4 text-destructive" />{" "}
                                    เป็นผู้ดูแลระบบ
                                    {u.role === "admin" && (
                                      <Check className="w-3 h-3 ml-auto" />
                                    )}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AddUserModal({ onSuccess }: { onSuccess: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successData, setSuccessData] = useState<{
    email: string;
    tempPass: string;
  } | null>(null);

  const [form, setForm] = useState({
    email: "",
    full_name: "",
    phone: "",
    role: "staff" as "staff" | "admin",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Something went wrong");

      setSuccessData({ email: form.email, tempPass: data.tempPassword });
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("คัดลอกรหัสผ่านแล้ว!");
  };

  const resetAndClose = () => {
    setIsOpen(false);
    setSuccessData(null);
    setForm({ email: "", full_name: "", phone: "", role: "staff" });
    setError("");
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="btn btn-primary rounded-2xl gap-2 font-bold shadow-lg shadow-primary/20 active-bounce px-6"
      >
        <UserPlus className="w-4 h-4" />
        เพิ่มพนักงาน
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-card w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-border/50 overflow-hidden animate-in zoom-in-95 duration-300">
            {successData ? (
              <div className="p-10 text-center space-y-8">
                <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto ring-8 ring-success/5">
                  <Check className="w-10 h-10 text-success" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-black tracking-tight">
                    สร้างบัญชีสำเร็จ!
                  </h3>
                  <p className="text-muted-foreground text-sm font-medium">
                    บัญชีของ{" "}
                    <span className="text-foreground font-bold">
                      {successData.email}
                    </span>{" "}
                    พร้อมใช้งานแล้ว
                  </p>
                </div>

                <div className="p-6 rounded-3xl bg-secondary/30 border border-border/50 space-y-4 relative group">
                  <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest text-muted-foreground/60">
                    <span>รหัสผ่านชั่วคราว</span>
                    <Key className="w-4 h-4 opacity-40" />
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <code className="text-2xl font-mono font-bold text-primary tracking-wider truncate">
                      {successData.tempPass}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(successData.tempPass)}
                      className="rounded-xl hover:bg-primary/10 hover:text-primary active-bounce"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-start gap-3 text-left">
                  <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs font-bold text-amber-800 leading-relaxed">
                    กรุณาส่งรหัสผ่านนี้ให้พนักงาน
                    และแนะนำให้เปลี่ยนรหัสผ่านทันทีหลังเข้าระบบครั้งแรก
                  </p>
                </div>

                <Button
                  onClick={resetAndClose}
                  className="w-full btn-primary rounded-2xl h-14 font-black shadow-xl shadow-primary/20 active-bounce group"
                >
                  ตกลงและปิดหน้าต่าง
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="p-8 border-b border-border/50 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[1.25rem] bg-primary/10 text-primary flex items-center justify-center">
                      <UserPlus className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black tracking-tight leading-none">
                        เพิ่มพนักงานใหม่
                      </h3>
                      <p className="text-xs font-bold text-muted-foreground mt-1.5 uppercase tracking-widest opacity-60">
                        Create Staff/Admin Account
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={resetAndClose}
                    className="rounded-full hover:bg-secondary active-bounce"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <div className="p-8 space-y-6">
                  {error && (
                    <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-bold flex items-center gap-3">
                      <X className="w-4 h-4 shrink-0" />
                      {error}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/80 flex items-center gap-2 px-1">
                        <UserIcon className="w-3.5 h-3.5" />
                        ชื่อ-นามสกุล
                      </label>
                      <Input
                        required
                        placeholder="กรอกชื่อจริงและนามสกุล"
                        className="rounded-2xl h-12 border-border/50 focus:ring-4 focus:ring-primary/10"
                        value={form.full_name}
                        onChange={(e) =>
                          setForm({ ...form, full_name: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/80 flex items-center gap-2 px-1">
                        <Phone className="w-3.5 h-3.5" />
                        เบอร์โทรศัพท์
                      </label>
                      <Input
                        placeholder="เช่น 0812345678"
                        className="rounded-2xl h-12 border-border/50 focus:ring-4 focus:ring-primary/10"
                        value={form.phone}
                        onChange={(e) =>
                          setForm({ ...form, phone: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/80 flex items-center gap-2 px-1">
                      <Mail className="w-3.5 h-3.5" />
                      อีเมลพนักงาน
                    </label>
                    <Input
                      required
                      type="email"
                      placeholder="employee@poyoye.com"
                      className="rounded-2xl h-12 border-border/50 focus:ring-4 focus:ring-primary/10"
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/80 flex items-center gap-2 px-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      สิทธิ์การเข้าถึง
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {(["staff", "admin"] as const).map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setForm({ ...form, role: r })}
                          className={cn(
                            "py-4 rounded-2xl border-2 font-bold transition-all active-bounce flex items-center justify-center gap-2",
                            form.role === r
                              ? "bg-primary/5 border-primary text-primary shadow-sm shadow-primary/10"
                              : "bg-transparent border-border/40 text-muted-foreground hover:border-border hover:bg-secondary/30",
                          )}
                        >
                          {r === "staff" ? (
                            <Wrench className="w-4 h-4" />
                          ) : (
                            <ShieldCheck className="w-4 h-4" />
                          )}
                          {r === "staff" ? "Staff/ช่าง" : "Admin"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-8 bg-secondary/10 flex items-center justify-end gap-4 border-t border-border/50">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={resetAndClose}
                    className="font-bold rounded-2xl h-12 active-bounce"
                  >
                    ยกเลิก
                  </Button>
                  <Button
                    type="submit"
                    loading={loading}
                    disabled={loading}
                    className="btn btn-primary rounded-2xl h-12 px-8 font-black shadow-lg shadow-primary/20 active-bounce"
                  >
                    สร้างบัญชีเลย
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
