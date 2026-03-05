import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { format } from "date-fns";
import { th } from "date-fns/locale";

// Set Styles
// Rules for @react-pdf stability:
// 1. Avoid shorthands (border, padding, margin)
// 2. Use integer border widths if possible
// 3. Avoid paddingVertical/Horizontal if suspicious
const styles = StyleSheet.create({
  page: {
    paddingTop: 45,
    paddingRight: 45,
    paddingBottom: 45,
    paddingLeft: 45,
    fontFamily: "IBM Plex Sans Thai",
    fontSize: 10,
    color: "#475569",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 45,
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: "#f1f5f9",
    paddingBottom: 30,
  },
  shopInfo: {
    flexDirection: "column",
  },
  shopName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  shopSub: {
    fontSize: 9,
    color: "#94a3b8",
    letterSpacing: 0.5,
    marginTop: 2,
    marginBottom: 2,
  },
  docTitle: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "right",
    color: "#0f172a",
    letterSpacing: -1,
  },
  docSub: {
    fontSize: 10,
    textAlign: "right",
    color: "#64748b",
    marginTop: 8,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#1e293b",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    backgroundColor: "#f8fafc",
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 12,
    paddingRight: 12,
    borderRadius: 6,
  },
  grid: {
    flexDirection: "row",
  },
  col: {
    flex: 1,
    marginRight: 15,
  },
  field: {
    marginBottom: 15,
  },
  label: {
    color: "#94a3b8",
    fontSize: 8,
    textTransform: "uppercase",
    marginBottom: 5,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  value: {
    fontSize: 10,
    color: "#334155",
  },
  table: {
    width: "100%",
    marginTop: 15,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: "#f1f5f9",
    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: 12,
    paddingRight: 12,
    borderRadius: 8,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: "#f1f5f9",
    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: 12,
    paddingRight: 12,
    alignItems: "center",
    minHeight: 35,
  },
  colDesc: { flex: 4 },
  colQty: { flex: 1, textAlign: "center" },
  colPrice: { flex: 1.5, textAlign: "right" },
  colTotal: { flex: 1.5, textAlign: "right" },
  tableHeaderText: {
    fontWeight: "bold",
    fontSize: 9,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  summary: {
    marginTop: 45,
    alignSelf: "flex-end",
    width: "48%",
    backgroundColor: "#f8fafc",
    paddingTop: 20,
    paddingBottom: 20,
    paddingLeft: 20,
    paddingRight: 20,
    borderRadius: 16,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderStyle: "solid",
    borderColor: "#f1f5f9",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 8,
    paddingBottom: 8,
  },
  grandTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: "#e2e8f0",
    paddingTop: 15,
    marginTop: 15,
  },
  grandTotalText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
    letterSpacing: -0.5,
  },
  footer: {
    position: "absolute",
    bottom: 45,
    left: 45,
    right: 45,
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: "#f1f5f9",
    paddingTop: 30,
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 8.5,
    flexDirection: "column",
  },
  badge: {
    paddingTop: 5,
    paddingBottom: 5,
    paddingLeft: 10,
    paddingRight: 10,
    borderRadius: 6,
    fontSize: 8,
    fontWeight: "bold",
    textTransform: "uppercase",
    alignSelf: "flex-start",
  },
  badgeSuccess: {
    backgroundColor: "#f0fdf4",
    color: "#166534",
  },
  badgePending: {
    backgroundColor: "#fffbeb",
    color: "#92400e",
  },
});

interface RepairDocumentProps {
  type: "INVOICE" | "RECEIPT" | "REPORT";
  job: any;
  customer: any;
  motorcycle: any;
  items: any[];
  payment?: any;
}

export const RepairDocumentPDF = ({ type, job, customer, motorcycle, items, payment }: RepairDocumentProps) => {
  const partsTotal = items.reduce((sum, item) => sum + Number(item.price_total || 0), 0);
  const laborTotal = Number(job.labor_cost || 0);
  const total = partsTotal + laborTotal;

  const titleMap = {
    INVOICE: "ใบแจ้งหนี้",
    RECEIPT: "ใบเสร็จรับเงิน",
    REPORT: "ใบบันทึกผลการซ่อม",
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.shopInfo}>
            <Text style={styles.shopName}>MTD Motorcycle Service</Text>
            <Text style={styles.shopSub}>ศูนย์บริการซ่อมบำรุงและดูแลรักษารถมอเตอร์ไซค์ครบวงจร</Text>
            <Text style={styles.shopSub}>โทร: 08x-xxx-xxxx | LINE: @MTDMoto</Text>
          </View>
          <View>
            <Text style={styles.docTitle}>{titleMap[type]}</Text>
            <Text style={styles.docSub}>NO. {job.id.slice(-8).toUpperCase()}</Text>
            <Text style={[styles.docSub, { color: "#94a3b8" }]}>วันที่: {format(new Date(), "dd MMMM yyyy", { locale: th })}</Text>
          </View>
        </View>

        {/* Info Grid */}
        <View style={styles.grid}>
          <View style={styles.col}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>ข้อมูลลูกค้า</Text>
              <View style={styles.field}>
                <Text style={styles.label}>ชื่อ-นามสกุล</Text>
                <Text style={styles.value}>{customer.full_name}</Text>
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>เบอร์โทรศัพท์</Text>
                <Text style={styles.value}>{customer.phone || "-"}</Text>
              </View>
            </View>
          </View>
          <View style={styles.col}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>ข้อมูลรถ</Text>
              <View style={styles.field}>
                <Text style={styles.label}>ยี่ห้อ / รุ่น / ปี</Text>
                <Text style={styles.value}>
                  {motorcycle.brand} {motorcycle.model} {motorcycle.year ? `(${motorcycle.year})` : ""}
                </Text>
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>เลขทะเบียน</Text>
                <Text style={styles.value}>{motorcycle.license_plate}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Report Specific Section */}
        {type === "REPORT" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>รายละเอียดการดำเนินการ</Text>
            <View style={styles.grid}>
              <View style={styles.col}>
                <View style={styles.field}>
                  <Text style={styles.label}>อาการแจ้งซ่อม / สาเหตุ</Text>
                  <Text style={styles.value}>{job.booking?.symptom_note || "ตรวจสอบเครื่องยนต์ทั่วไป"}</Text>
                </View>
                <View style={styles.field}>
                  <Text style={styles.label}>วันเริ่มดำเนินการ</Text>
                  <Text style={styles.value}>
                    {job.start_date ? format(new Date(job.start_date), "dd MMM yyyy HH:mm น.", { locale: th }) : "-"}
                  </Text>
                </View>
              </View>
              <View style={styles.col}>
                <View style={styles.field}>
                  <Text style={styles.label}>หมายเหตุจากช่าง</Text>
                  <Text style={styles.value}>{job.note || "ดำเนินการเรียบร้อยแล้ว"}</Text>
                </View>
                <View style={styles.field}>
                  <Text style={styles.label}>วันส่งมอบคืน</Text>
                  <Text style={styles.value}>
                    {job.end_date ? format(new Date(job.end_date), "dd MMM yyyy HH:mm น.", { locale: th }) : "-"}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colDesc]}>รายการอะไหล่ / บริการ</Text>
            <Text style={[styles.tableHeaderText, styles.colQty]}>จำนวน</Text>
            <Text style={[styles.tableHeaderText, styles.colPrice]}>ราคา/หน่วย</Text>
            <Text style={[styles.tableHeaderText, styles.colTotal]}>รวมเงิน</Text>
          </View>

          {/* Labor Cost Row */}
          {laborTotal > 0 && (
            <View style={styles.tableRow}>
              <Text style={[styles.value, styles.colDesc]}>ค่าแรงช่าง / บริการงานซ่อมบำรุง</Text>
              <Text style={[styles.value, styles.colQty]}>1</Text>
              <Text style={[styles.value, styles.colPrice]}>{laborTotal.toLocaleString()} ฿</Text>
              <Text style={[styles.value, styles.colTotal]}>{laborTotal.toLocaleString()} ฿</Text>
            </View>
          )}

          {/* Parts Rows */}
          {items.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={[styles.value, styles.colDesc]}>{item.part?.name || item.name}</Text>
              <Text style={[styles.value, styles.colQty]}>{item.quantity}</Text>
              <Text style={[styles.value, styles.colPrice]}>{Number(item.unit_price).toLocaleString()} ฿</Text>
              <Text style={[styles.value, styles.colTotal]}>{Number(item.price_total).toLocaleString()} ฿</Text>
            </View>
          ))}

          {items.length === 0 && laborTotal === 0 && (
            <View style={styles.tableRow}>
              <Text style={[styles.value, styles.colDesc, { color: "#94a3b8", fontStyle: "italic" }]}>ไม่มีรายการค่าใช้จ่าย</Text>
            </View>
          )}
        </View>

        {/* Summary (Only for Invoice/Receipt OR if report has costs) */}
        {(type !== "REPORT" || total > 0) && (
          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.label}>รวมค่าอะไหล่</Text>
              <Text style={styles.value}>{partsTotal.toLocaleString()} ฿</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.label}>รวมค่าแรงช่าง</Text>
              <Text style={styles.value}>{laborTotal.toLocaleString()} ฿</Text>
            </View>
            <View style={styles.grandTotal}>
              <Text style={styles.grandTotalText}>ยอดรวมสุทธิ</Text>
              <Text style={styles.grandTotalText}>{total.toLocaleString()} ฿</Text>
            </View>
          </View>
        )}

        {/* Payment Info / Transaction History */}
        {type === "RECEIPT" && payment && (
          <View
            style={{
              marginTop: 40,
              paddingTop: 20,
              paddingBottom: 20,
              paddingLeft: 20,
              paddingRight: 20,
              backgroundColor: "#f0fdf4",
              borderRadius: 12,
              borderTopWidth: 1,
              borderRightWidth: 1,
              borderBottomWidth: 1,
              borderLeftWidth: 1,
              borderStyle: "solid",
              borderColor: "#bbf7d0",
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15 }}>
              <Text style={{ fontSize: 11, fontWeight: "bold", color: "#166534" }}>ข้อมูลการชำระเงินเรียบร้อยแล้ว</Text>
              <Text style={[styles.badge, styles.badgeSuccess]}>Paid Success</Text>
            </View>
            <View style={styles.grid}>
              <View style={styles.col}>
                <Text style={styles.label}>วิธีชำระเงิน</Text>
                <Text style={styles.value}>{payment.method}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>วันที่ชำระ</Text>
                <Text style={styles.value}>
                  {format(new Date(payment.paid_at || payment.created_at), "dd MMM yyyy HH:mm น.", { locale: th })}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={{ fontWeight: "bold", color: "#334155", marginBottom: 4 }}>ขอบคุณที่ไว้วางใจใช้บริการ MTD Motorcycle Service</Text>
          <Text style={{ marginBottom: 4 }}>เรายินดีที่ได้ดูแลและหวังว่าจะได้ต้อนรับท่านอีกในครั้งถัดไป</Text>
          <Text style={{ marginTop: 8, opacity: 0.5 }}>เอกสารฉบับนี้จัดทำโดยระบบอัตโนมัติ ไม่ต้องมีลายเซ็น</Text>
        </View>
      </Page>
    </Document>
  );
};
