"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";
import type { UldAssignmentResult } from "@/features/planning";
import type { WeightBreakdown, CgResult } from "../types";

// ============================================================================
// TYPES
// ============================================================================

export type LoadSheetData = {
  // Flight info
  flightNumber: string;
  date: string;
  aircraftType: string;
  aircraftRegistration: string;
  origin: string;
  destination: string;
  
  // Crew
  captain?: string;
  loadmaster?: string;
  
  // Weights
  weights: Partial<WeightBreakdown>;
  limits: {
    maxZeroFuelWeightKg: number;
    maxTakeoffWeightKg: number;
    maxLandingWeightKg: number;
    maxPayloadKg: number;
  };
  
  // CG data
  cgData: {
    zfwCg?: Partial<CgResult>;
    towCg?: Partial<CgResult>;
    ldwCg?: Partial<CgResult>;
  };
  
  // Trim
  stabilizerTrim?: number;
  
  // ULD assignments
  assignments: UldAssignmentResult[];
  
  // Fuel
  fuel?: {
    blockFuelKg: number;
    taxiFuelKg: number;
    takeoffFuelKg: number;
    tripFuelKg: number;
    landingFuelKg: number;
  };
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 9,
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: "#000000",
  },
  headerLeft: {
    flexDirection: "column",
  },
  headerRight: {
    flexDirection: "column",
    alignItems: "flex-end",
  },
  title: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: "#666666",
  },
  flightInfo: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    backgroundColor: "#f0f0f0",
    padding: 4,
    marginBottom: 6,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#cccccc",
    paddingVertical: 3,
  },
  rowHighlight: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#cccccc",
    paddingVertical: 3,
    backgroundColor: "#f5f5f5",
  },
  label: {
    width: "50%",
    color: "#333333",
  },
  value: {
    width: "25%",
    textAlign: "right",
    fontFamily: "Helvetica-Bold",
  },
  limit: {
    width: "25%",
    textAlign: "right",
    color: "#666666",
  },
  table: {
    marginTop: 6,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#e0e0e0",
    paddingVertical: 4,
    fontFamily: "Helvetica-Bold",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#cccccc",
    paddingVertical: 3,
  },
  tableCell: {
    textAlign: "center",
  },
  col1: { width: "15%" },
  col2: { width: "15%" },
  col3: { width: "20%" },
  col4: { width: "20%" },
  col5: { width: "15%" },
  col6: { width: "15%" },
  cgSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  cgBox: {
    width: "30%",
    padding: 8,
    borderWidth: 1,
    borderColor: "#cccccc",
    borderRadius: 4,
  },
  cgLabel: {
    fontSize: 8,
    color: "#666666",
    marginBottom: 2,
  },
  cgValue: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
  },
  cgStatus: {
    fontSize: 8,
    marginTop: 2,
  },
  statusOk: {
    color: "#22c55e",
  },
  statusWarning: {
    color: "#f97316",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 30,
    right: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#cccccc",
    paddingTop: 10,
    fontSize: 8,
    color: "#666666",
  },
  signatureSection: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  signatureBox: {
    width: "45%",
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    marginTop: 30,
    marginBottom: 4,
  },
  signatureLabel: {
    fontSize: 8,
    color: "#666666",
  },
  trimBox: {
    marginTop: 10,
    padding: 8,
    borderWidth: 2,
    borderColor: "#000000",
    alignItems: "center",
  },
  trimLabel: {
    fontSize: 8,
    marginBottom: 2,
  },
  trimValue: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
  },
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatWeight(kg: number | undefined): string {
  if (kg === undefined) return "—";
  return kg.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function formatCg(percent: number | undefined): string {
  if (percent === undefined) return "—";
  return `${percent.toFixed(1)}%`;
}

// ============================================================================
// LOAD SHEET DOCUMENT COMPONENT
// ============================================================================

function LoadSheetDocument({ data }: { data: LoadSheetData }) {
  const {
    flightNumber,
    date,
    aircraftType,
    aircraftRegistration,
    origin,
    destination,
    weights,
    limits,
    cgData,
    stabilizerTrim,
    assignments,
    captain,
    loadmaster,
  } = data;

  // Calculate derived weights
  const oew = weights.operatingEmptyWeightKg ?? 48000;
  const dow = weights.dryOperatingWeightKg ?? oew;
  const payload = weights.payloadKg ?? 0;
  const zfw = weights.zeroFuelWeightKg ?? dow + payload;
  const tof = weights.takeoffFuelKg ?? 0;
  const tow = weights.takeoffWeightKg ?? zfw + tof;
  const tripFuel = weights.tripFuelKg ?? 0;
  const ldw = weights.landingWeightKg ?? tow - tripFuel;

  // Group assignments by deck
  const mainDeckAssignments = assignments.filter((a) => {
    const pos = a.positionCode;
    return pos && /^\d/.test(pos);
  });
  const lowerDeckAssignments = assignments.filter((a) => {
    const pos = a.positionCode;
    return pos && (pos.startsWith("FWD") || pos.startsWith("AFT") || pos === "BULK");
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>LOAD & TRIM SHEET</Text>
            <Text style={styles.subtitle}>Computer Generated - For Operational Use</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.flightInfo}>{flightNumber}</Text>
            <Text style={styles.subtitle}>{date}</Text>
            <Text style={styles.subtitle}>{origin} → {destination}</Text>
          </View>
        </View>

        {/* Aircraft Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AIRCRAFT INFORMATION</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Aircraft Type</Text>
            <Text style={[styles.value, { width: "50%" }]}>{aircraftType}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Registration</Text>
            <Text style={[styles.value, { width: "50%" }]}>{aircraftRegistration || "—"}</Text>
          </View>
        </View>

        {/* Weight Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>WEIGHT SUMMARY (KG)</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Operating Empty Weight</Text>
            <Text style={styles.value}>{formatWeight(oew)}</Text>
            <Text style={styles.limit}></Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Dry Operating Weight</Text>
            <Text style={styles.value}>{formatWeight(dow)}</Text>
            <Text style={styles.limit}></Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Total Traffic Load (Payload)</Text>
            <Text style={styles.value}>{formatWeight(payload)}</Text>
            <Text style={styles.limit}>Max: {formatWeight(limits.maxPayloadKg)}</Text>
          </View>
          <View style={styles.rowHighlight}>
            <Text style={[styles.label, { fontFamily: "Helvetica-Bold" }]}>Zero Fuel Weight</Text>
            <Text style={styles.value}>{formatWeight(zfw)}</Text>
            <Text style={styles.limit}>Max: {formatWeight(limits.maxZeroFuelWeightKg)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Take-off Fuel</Text>
            <Text style={styles.value}>{formatWeight(tof)}</Text>
            <Text style={styles.limit}></Text>
          </View>
          <View style={styles.rowHighlight}>
            <Text style={[styles.label, { fontFamily: "Helvetica-Bold" }]}>Take-off Weight</Text>
            <Text style={styles.value}>{formatWeight(tow)}</Text>
            <Text style={styles.limit}>Max: {formatWeight(limits.maxTakeoffWeightKg)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Trip Fuel</Text>
            <Text style={styles.value}>{formatWeight(tripFuel)}</Text>
            <Text style={styles.limit}></Text>
          </View>
          <View style={styles.rowHighlight}>
            <Text style={[styles.label, { fontFamily: "Helvetica-Bold" }]}>Landing Weight</Text>
            <Text style={styles.value}>{formatWeight(ldw)}</Text>
            <Text style={styles.limit}>Max: {formatWeight(limits.maxLandingWeightKg)}</Text>
          </View>
        </View>

        {/* CG Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CENTER OF GRAVITY (% MAC)</Text>
          <View style={styles.cgSection}>
            <View style={styles.cgBox}>
              <Text style={styles.cgLabel}>ZFW CG</Text>
              <Text style={styles.cgValue}>{formatCg(cgData.zfwCg?.cgPercentMac)}</Text>
              <Text style={[styles.cgStatus, cgData.zfwCg?.isWithinEnvelope ? styles.statusOk : styles.statusWarning]}>
                {cgData.zfwCg?.isWithinEnvelope ? "✓ Within Limits" : "⚠ Check Limits"}
              </Text>
            </View>
            <View style={styles.cgBox}>
              <Text style={styles.cgLabel}>TOW CG</Text>
              <Text style={styles.cgValue}>{formatCg(cgData.towCg?.cgPercentMac)}</Text>
              <Text style={[styles.cgStatus, cgData.towCg?.isWithinEnvelope !== false ? styles.statusOk : styles.statusWarning]}>
                {cgData.towCg?.isWithinEnvelope !== false ? "✓ Within Limits" : "⚠ Check Limits"}
              </Text>
            </View>
            <View style={styles.cgBox}>
              <Text style={styles.cgLabel}>LDW CG</Text>
              <Text style={styles.cgValue}>{formatCg(cgData.ldwCg?.cgPercentMac)}</Text>
              <Text style={[styles.cgStatus, cgData.ldwCg?.isWithinEnvelope !== false ? styles.statusOk : styles.statusWarning]}>
                {cgData.ldwCg?.isWithinEnvelope !== false ? "✓ Within Limits" : "⚠ Check Limits"}
              </Text>
            </View>
          </View>
        </View>

        {/* Stabilizer Trim */}
        {stabilizerTrim !== undefined && (
          <View style={styles.trimBox}>
            <Text style={styles.trimLabel}>STABILIZER TRIM SETTING</Text>
            <Text style={styles.trimValue}>{stabilizerTrim.toFixed(1)} UNITS</Text>
          </View>
        )}

        {/* ULD Distribution */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ULD DISTRIBUTION - MAIN DECK</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCell, styles.col1]}>POS</Text>
              <Text style={[styles.tableCell, styles.col2]}>ULD TYPE</Text>
              <Text style={[styles.tableCell, styles.col3]}>ULD NUMBER</Text>
              <Text style={[styles.tableCell, styles.col4]}>WEIGHT (KG)</Text>
              <Text style={[styles.tableCell, styles.col5]}>VOL %</Text>
              <Text style={[styles.tableCell, styles.col6]}>ITEMS</Text>
            </View>
            {mainDeckAssignments.map((a, idx) => (
              <View key={idx} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.col1]}>{a.positionCode || "—"}</Text>
                <Text style={[styles.tableCell, styles.col2]}>{a.uldTypeCode}</Text>
                <Text style={[styles.tableCell, styles.col3]}>{a.uldNumber || "Virtual"}</Text>
                <Text style={[styles.tableCell, styles.col4]}>{formatWeight(a.totalWeightKg)}</Text>
                <Text style={[styles.tableCell, styles.col5]}>{Math.round(a.volumeUtilization * 100)}</Text>
                <Text style={[styles.tableCell, styles.col6]}>{a.cargoItems.length}</Text>
              </View>
            ))}
            {mainDeckAssignments.length === 0 && (
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: "100%", color: "#999999" }]}>No main deck cargo</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ULD DISTRIBUTION - LOWER DECK</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCell, styles.col1]}>POS</Text>
              <Text style={[styles.tableCell, styles.col2]}>ULD TYPE</Text>
              <Text style={[styles.tableCell, styles.col3]}>ULD NUMBER</Text>
              <Text style={[styles.tableCell, styles.col4]}>WEIGHT (KG)</Text>
              <Text style={[styles.tableCell, styles.col5]}>VOL %</Text>
              <Text style={[styles.tableCell, styles.col6]}>ITEMS</Text>
            </View>
            {lowerDeckAssignments.map((a, idx) => (
              <View key={idx} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.col1]}>{a.positionCode || "—"}</Text>
                <Text style={[styles.tableCell, styles.col2]}>{a.uldTypeCode}</Text>
                <Text style={[styles.tableCell, styles.col3]}>{a.uldNumber || "Virtual"}</Text>
                <Text style={[styles.tableCell, styles.col4]}>{formatWeight(a.totalWeightKg)}</Text>
                <Text style={[styles.tableCell, styles.col5]}>{Math.round(a.volumeUtilization * 100)}</Text>
                <Text style={[styles.tableCell, styles.col6]}>{a.cargoItems.length}</Text>
              </View>
            ))}
            {lowerDeckAssignments.length === 0 && (
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: "100%", color: "#999999" }]}>No lower deck cargo</Text>
              </View>
            )}
          </View>
        </View>

        {/* Signatures */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Captain: {captain || "________________"}</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Loadmaster: {loadmaster || "________________"}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Generated: {new Date().toISOString()}</Text>
          <Text>Flight Load Planning System</Text>
          <Text>Page 1 of 1</Text>
        </View>
      </Page>
    </Document>
  );
}

// ============================================================================
// EXPORT FUNCTION
// ============================================================================

export async function generateLoadSheetPdf(data: LoadSheetData): Promise<Blob> {
  const doc = <LoadSheetDocument data={data} />;
  const blob = await pdf(doc).toBlob();
  return blob;
}

export function downloadLoadSheet(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

