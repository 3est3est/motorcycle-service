"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { FileDown, Loader2 } from "lucide-react";
import { ReportPDF } from "./report-pdf";
import { registerThaiFonts } from "./fonts";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PDFDownloadLink = dynamic(() => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink), {
  ssr: false,
  loading: () => (
    <Button variant="ghost" size="sm" className="gap-2 opacity-50 cursor-not-allowed h-10 px-4 rounded-xl">
      <Loader2 className="w-4 h-4 animate-spin" />
      <span className="text-[10px] font-black uppercase tracking-widest">Loading...</span>
    </Button>
  ),
});

interface ReportExportButtonProps {
  type: "STOCK" | "REVENUE";
  data: any[];
  stats: any;
  label?: string;
}

export function ReportExportButton({ type, data, stats, label }: ReportExportButtonProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    registerThaiFonts();
    setMounted(true);
  }, []);

  if (!mounted || !data) return null;

  const fileName = `${type === "STOCK" ? "Stock_Report" : "Revenue_Report"}_${format(new Date(), "yyyy-MM-dd")}.pdf`;

  function format(date: Date, fmt: string) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  return (
    <PDFDownloadLink document={<ReportPDF type={type} data={data} stats={stats} />} fileName={fileName} style={{ textDecoration: "none" }}>
      {({ loading }) => (
        <Button
          disabled={loading}
          className={cn(
            "h-14 px-10 rounded-full font-black uppercase text-[12px] tracking-tight transition-all duration-300 shadow-lg hover:shadow-primary/40 hover:scale-105 active:scale-95 flex items-center gap-3 bg-primary text-primary-foreground border-none group",
            loading && "opacity-70 cursor-not-allowed",
          )}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin text-primary-foreground" />
          ) : (
            <FileDown className="w-6 h-6 transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-0.5" />
          )}
          <span className="relative z-10">{label || (type === "STOCK" ? "เพิ่มอะไหล่ใหม่ (PDF)" : "Export Revenue PDF")}</span>
        </Button>
      )}
    </PDFDownloadLink>
  );
}
