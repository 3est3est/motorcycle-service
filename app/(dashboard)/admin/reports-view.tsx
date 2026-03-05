"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Package, Download, FileText, BarChart3, AlertCircle, ArrowUpRight, Loader2 } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";

// Dynamic import for PDF because it's heavy and client-side only
const PDFDownloadLink = dynamic(() => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink), { ssr: false });
const ReportPDF = dynamic(() => import("@/components/pdf/report-pdf").then((mod) => mod.ReportPDF), { ssr: false });

export function ReportsView() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "reports"],
    queryFn: async () => {
      const res = await fetch("/api/admin/reports");
      if (!res.ok) throw new Error("Failed to fetch reports");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-3xl" />
          ))}
        </div>
        <Skeleton className="h-[400px] rounded-3xl" />
      </div>
    );
  }

  if (!data) return null;

  const { stockReports, revenueReports, trends } = data;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ReportSummaryCard
          title="รายได้รวม (ทุกเวลา)"
          value={formatCurrency(revenueReports.stats.totalRevenue)}
          icon={TrendingUp}
          color="text-emerald-500"
          description="ยอดรวมธุรกรรมที่สำเร็จทั้งหมด"
        />
        <ReportSummaryCard
          title="มูลค่าคงคลัง"
          value={formatCurrency(stockReports.stats.totalValue)}
          icon={Package}
          color="text-amber-500"
          description="มูลค่ารวมของอะไหล่ทั้งหมดในร้าน"
        />
        <ReportSummaryCard
          title="รายการอะไหล่ใกล้หมด"
          value={stockReports.stats.lowStockCount}
          icon={AlertCircle}
          color="text-rose-500"
          description="รายการที่จำนวนน้อยกว่าเกณฑ์ขั้นต่ำ"
          unit="รายการ"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Monthly Revenue Chart */}
        <Card className="lg:col-span-2 border-none shadow-premium bg-card/60 backdrop-blur-md overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                แนวโน้มรายได้ 6 เดือนล่าสุด
              </CardTitle>
              <CardDescription className="text-[10px] font-bold opacity-40 uppercase tracking-widest mt-1">
                Growth & Revenue Trends
              </CardDescription>
            </div>
            <BarChart3 className="w-5 h-5 text-primary opacity-20" />
          </CardHeader>
          <CardContent className="pt-10">
            <div className="h-64 flex items-end gap-4 px-2">
              {trends.map((t: any, i: number) => {
                const max = Math.max(...trends.map((m: any) => m.amount), 1);
                const height = (t.amount / max) * 100;
                return (
                  <div key={i} className="group relative flex-1 flex flex-col items-center gap-3">
                    <div className="absolute -top-12 scale-0 group-hover:scale-100 transition-all duration-300 bg-primary text-primary-foreground font-black text-[10px] px-3 py-2 rounded-xl z-10 shadow-xl shadow-primary/20 pointer-events-none whitespace-nowrap">
                      {formatCurrency(t.amount)}
                    </div>
                    <div
                      className="w-full bg-primary/10 group-hover:bg-primary/40 rounded-t-2xl transition-all duration-700 ease-out border-x border-t border-transparent group-hover:border-primary/20"
                      style={{ height: `${height}%` }}
                    >
                      <div className="w-full h-full bg-linear-to-t from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-t-2xl" />
                    </div>
                    <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-tighter truncate w-full text-center group-hover:text-primary transition-colors">
                      {t.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Export Actions */}
        <Card className="border-none shadow-premium bg-primary text-primary-foreground overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
            <FileText className="w-32 h-32 rotate-12" />
          </div>
          <CardHeader>
            <CardTitle className="text-xl font-black">ออกรายงาน PDF</CardTitle>
            <CardDescription className="text-primary-foreground/60 font-bold text-[10px] uppercase tracking-widest">
              Generate Official Reports
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {isMounted && (
              <>
                <PDFDownloadButton type="REVENUE" data={revenueReports.data} stats={revenueReports.stats} label="รายงานสรุปรายได้" />
                <PDFDownloadButton type="STOCK" data={stockReports.data} stats={stockReports.stats} label="รายงานสรุปคลังอะไหล่" />
              </>
            )}
            {!isMounted && (
              <Button disabled className="w-full bg-white/10 border-none text-white/40 h-14 rounded-2xl">
                กำลังเตรียมระบบดาวน์โหลด...
              </Button>
            )}
            <p className="text-[9px] font-medium text-primary-foreground/40 text-center uppercase tracking-widest mt-6">
              ระบบส่งรายงานเข้าศูนย์กลางอัตโนมัติทุกสิ้นเดือน
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ReportSummaryCard({ title, value, icon: Icon, color, description, unit = "" }: any) {
  return (
    <Card className="border-none shadow-premium bg-card/60 backdrop-blur-md overflow-hidden group">
      <CardContent className="p-8">
        <div className="flex items-start justify-between">
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 leading-none">{title}</p>
              <div className="flex items-baseline gap-2">
                <p
                  className={cn(
                    "text-3xl font-black tracking-tighter leading-none group-hover:scale-105 transition-transform origin-left",
                    color,
                  )}
                >
                  {value}
                </p>
                {unit && <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">{unit}</span>}
              </div>
            </div>
            <p className="text-[10px] font-bold text-muted-foreground/20 uppercase tracking-widest leading-none flex items-center gap-1.5">
              <ArrowUpRight className="w-3 h-3" /> {description}
            </p>
          </div>
          <div
            className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center bg-muted/20 border border-muted-foreground/5 shadow-inner transition-premium group-hover:rotate-6",
              color,
            )}
          >
            <Icon className="w-7 h-7 font-black opacity-80" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PDFDownloadButton({ type, data, stats, label }: any) {
  return (
    <PDFDownloadLink
      document={<ReportPDF type={type} data={data} stats={stats} />}
      fileName={`${type === "STOCK" ? "inventory" : "revenue"}-report-${new Date().getTime()}.pdf`}
    >
      {({ loading }) => (
        <Button
          disabled={loading}
          className="w-full h-14 rounded-2xl bg-white text-primary hover:bg-white/90 font-black uppercase tracking-[0.15em] text-[10px] shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3 border-none"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {label}
        </Button>
      )}
    </PDFDownloadLink>
  );
}
