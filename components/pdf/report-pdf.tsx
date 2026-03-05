"use client";

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { format } from "date-fns";
import { th } from "date-fns/locale";

// Defensive styles for @react-pdf
const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingRight: 40,
    paddingBottom: 40,
    paddingLeft: 40,
    fontFamily: "IBM Plex Sans Thai",
    fontSize: 10,
    color: "#475569",
  },
  header: {
    marginBottom: 35,
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: "#f1f5f9",
    paddingBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 10,
    color: "#94a3b8",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  table: {
    width: "100%",
    borderStyle: "solid",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: "#f1f5f9",
    minHeight: 35,
    alignItems: "center",
  },
  tableHeader: {
    backgroundColor: "#f8fafc",
    fontWeight: "bold",
    color: "#64748b",
  },
  tableCell: {
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 4,
    paddingRight: 4,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8,
    color: "#94a3b8",
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: "#f1f5f9",
    paddingTop: 10,
  },
  summaryGrid: {
    flexDirection: "row",
    marginTop: 20,
  },
  summaryCard: {
    flex: 1,
    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: 12,
    paddingRight: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    marginRight: 15,
  },
  summaryLabel: {
    fontSize: 8,
    color: "#64748b",
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#0f172a",
  },
});

interface ReportPDFProps {
  type: "STOCK" | "REVENUE";
  data: any[];
  stats: any;
}

export function ReportPDF({ type, data, stats }: ReportPDFProps) {
  const dateStr = format(new Date(), "dd MMMM yyyy HH:mm", { locale: th });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{type === "STOCK" ? "รายงานสรุปคลังอะไหล่" : "รายงานสรุปรายได้"}</Text>
          <Text style={styles.subtitle}>MTD MOTO SERVICE — {dateStr}</Text>
        </View>

        <View style={styles.summaryGrid}>
          {type === "STOCK" ? (
            <>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>จำนวนรายการทั้งหมด</Text>
                <Text style={styles.summaryValue}>{stats.totalItems} รายการ</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>สินค้าใกล้หมด (Low Stock)</Text>
                <Text style={styles.summaryValue}>{stats.lowStockCount} รายการ</Text>
              </View>
              <View style={[styles.summaryCard, { marginRight: 0 }]}>
                <Text style={styles.summaryLabel}>มูลค่ารวมในสต็อก</Text>
                <Text style={styles.summaryValue}>฿{stats.totalValue.toLocaleString()}</Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>จำนวนรายการชำระเงิน</Text>
                <Text style={styles.summaryValue}>{stats.totalCount} รายการ</Text>
              </View>
              <View style={[styles.summaryCard, { marginRight: 0 }]}>
                <Text style={styles.summaryLabel}>รายได้รวมทั้งหมด</Text>
                <Text style={styles.summaryValue}>฿{stats.totalRevenue.toLocaleString()}</Text>
              </View>
            </>
          )}
        </View>

        <View style={{ marginTop: 30 }}>
          <Text style={styles.sectionTitle}>{type === "STOCK" ? "รายการอะไหล่ในระบบ" : "ประวัติการรับชำระเงิน"}</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              {type === "STOCK" ? (
                <>
                  <Text style={[styles.tableCell, { flex: 3 }]}>ชื่ออะไหล่</Text>
                  <Text style={[styles.tableCell, { flex: 1 }]}>ในสต็อก</Text>
                  <Text style={[styles.tableCell, { flex: 1 }]}>ขั้นต่ำ</Text>
                  <Text style={[styles.tableCell, { flex: 1 }]}>ราคา</Text>
                </>
              ) : (
                <>
                  <Text style={[styles.tableCell, { flex: 1 }]}>ID</Text>
                  <Text style={[styles.tableCell, { flex: 2 }]}>ลูกค้า / รถ</Text>
                  <Text style={[styles.tableCell, { flex: 1 }]}>ช่องทาง</Text>
                  <Text style={[styles.tableCell, { flex: 1 }]}>วันที่</Text>
                  <Text style={[styles.tableCell, { flex: 1 }]}>ยอดเงิน</Text>
                </>
              )}
            </View>

            {data.map((item, i) => (
              <View key={i} style={styles.tableRow}>
                {type === "STOCK" ? (
                  <>
                    <Text style={[styles.tableCell, { flex: 3 }]}>{item.name}</Text>
                    <Text
                      style={[
                        styles.tableCell,
                        {
                          flex: 1,
                          color: item.stock_qty < (item.min_stock || 5) ? "#ef4444" : "#1e293b",
                        },
                      ]}
                    >
                      {item.stock_qty}
                    </Text>
                    <Text style={[styles.tableCell, { flex: 1 }]}>{item.min_stock || 5}</Text>
                    <Text style={[styles.tableCell, { flex: 1 }]}>{Number(item.price).toLocaleString()} ฿</Text>
                  </>
                ) : (
                  <>
                    <Text style={[styles.tableCell, { flex: 1 }]}>{item.id.slice(-6).toUpperCase()}</Text>
                    <Text style={[styles.tableCell, { flex: 2 }]}>{item.repair_job?.booking?.motorcycle?.model || "N/A"}</Text>
                    <Text style={[styles.tableCell, { flex: 1 }]}>{item.method}</Text>
                    <Text style={[styles.tableCell, { flex: 1 }]}>{format(new Date(item.created_at), "dd/MM/yy")}</Text>
                    <Text style={[styles.tableCell, { flex: 1 }]}>{Number(item.amount).toLocaleString()} ฿</Text>
                  </>
                )}
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.footer}>เอกสารนี้ระบุข้อมูลล่าสุด ณ วันที่ {dateStr} — พัฒนาโดย MTD Moto Service System</Text>
      </Page>
    </Document>
  );
}
