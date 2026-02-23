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
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
        <div className="flex flex-col sm:row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="ค้นหาชื่อ หรือ อีเมล..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            ทั้งหมด {users.length} บัญชี
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
                      <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        จัดการ
                      </th>
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
