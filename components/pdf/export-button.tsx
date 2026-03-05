"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { FileDown, Loader2 } from "lucide-react";
import { RepairDocumentPDF } from "./repair-document-pdf";
import { registerThaiFonts } from "./fonts";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Dynamic import for PDFDownloadLink to prevent SSR issues
const PDFDownloadLink = dynamic(() => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink), {
  ssr: false,
  loading: () => (
    <Button variant="ghost" size="sm" className="gap-2 opacity-50 cursor-not-allowed">
      <Loader2 className="w-4 h-4 animate-spin" />
      Loading...
    </Button>
  ),
});

interface ExportButtonProps {
  type: "INVOICE" | "RECEIPT" | "REPORT";
  job: any;
  items: any[];
  payment?: any;
}

export function ExportPDFButton({ type, job, items, payment }: ExportButtonProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    registerThaiFonts();
    setMounted(true);
  }, []);

  if (!mounted || !job) return null;

  const fileName = `${type === "INVOICE" ? "Invoice" : type === "RECEIPT" ? "Receipt" : "RepairReport"}_${job.id.slice(-6).toUpperCase()}.pdf`;

  return (
    <PDFDownloadLink
      document={
        <RepairDocumentPDF
          type={type}
          job={job}
          customer={job.booking.customer}
          motorcycle={job.booking.motorcycle}
          items={items}
          payment={payment}
        />
      }
      fileName={fileName}
    >
      {({ loading }) => (
        <Button
          className={cn(
            "h-12 px-8 rounded-full font-black uppercase tracking-tight text-[11px] border-none shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-primary/40 active:scale-95 flex items-center gap-2 bg-primary text-primary-foreground group",
            loading && "opacity-70 cursor-not-allowed",
          )}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-primary-foreground" />
          ) : (
            <FileDown className="w-5 h-5 transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-0.5" />
          )}
          <span>{type === "INVOICE" ? "Export Invoice" : type === "RECEIPT" ? "Export Receipt" : "Repair Report"}</span>
        </Button>
      )}
    </PDFDownloadLink>
  );
}
