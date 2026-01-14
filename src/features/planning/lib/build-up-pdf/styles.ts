/**
 * Build-Up PDF - Styles
 *
 * Typography, colors, and layout styles based on BUILD_UP_PLAN_PDF_SPEC.md
 */

import { StyleSheet } from "@react-pdf/renderer";

// ============================================================================
// COLOR PALETTE
// ============================================================================

export const COLORS = {
  // Text colors
  primaryBlack: "#000000",
  bodyText: "#333333",
  secondaryText: "#666666",
  mutedText: "#999999",

  // Background colors
  sectionBackground: "#F0F0F0",
  rowHighlight: "#F5F5F5",
  tableHeader: "#E0E0E0",

  // Border colors
  borderLight: "#CCCCCC",
  borderDark: "#000000",

  // Status colors
  success: "#16A34A",
  warning: "#F97316",
  error: "#DC2626",

  // Cargo type colors
  cargoGeneral: "#93C5FD",
  cargoPriority: "#FDBA74",
  cargoDangerous: "#FCA5A5",
  cargoPerishable: "#86EFAC",
  cargoValuable: "#D8B4FE",
  cargoTemperature: "#67E8F9",
} as const;

// ============================================================================
// SPACING
// ============================================================================

export const SPACING = {
  pageMargin: 20,
  sectionGap: 12,
  rowPadding: 3,
  cellPadding: 4,
  cgBoxPadding: 8,
} as const;

// ============================================================================
// STYLES
// ============================================================================

export const styles = StyleSheet.create({
  // Page
  page: {
    padding: SPACING.pageMargin,
    fontSize: 9,
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
  },

  // ============================================================================
  // HEADER
  // ============================================================================
  header: {
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.borderDark,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 10,
    color: COLORS.secondaryText,
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  headerInfo: {
    flexDirection: "row",
    gap: 20,
  },
  headerLabel: {
    fontSize: 8,
    color: COLORS.secondaryText,
  },
  headerValue: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
  },
  uldInfo: {
    flexDirection: "row",
    gap: 30,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  uldInfoItem: {
    flexDirection: "column",
  },

  // ============================================================================
  // SECTION
  // ============================================================================
  section: {
    marginBottom: SPACING.sectionGap,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    backgroundColor: COLORS.sectionBackground,
    padding: 4,
    marginBottom: 6,
  },

  // ============================================================================
  // ULD VISUALIZATION
  // ============================================================================
  visualizationContainer: {
    marginBottom: SPACING.sectionGap,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: 4,
    alignItems: "center",
  },
  visualizationTitle: {
    fontSize: 8,
    color: COLORS.secondaryText,
    marginBottom: 8,
  },
  uldOutline: {
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    backgroundColor: "#FAFAFA",
    position: "relative",
  },
  cargoItem: {
    position: "absolute",
    borderWidth: 0.5,
    borderColor: COLORS.bodyText,
    justifyContent: "center",
    alignItems: "center",
  },
  cargoLabel: {
    fontSize: 5,
    textAlign: "center",
  },
  dimensionLabel: {
    fontSize: 6,
    color: COLORS.secondaryText,
    marginTop: 4,
  },

  // ============================================================================
  // TABLE
  // ============================================================================
  table: {
    marginTop: 6,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: COLORS.tableHeader,
    paddingVertical: 4,
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.borderLight,
    paddingVertical: SPACING.rowPadding,
    fontSize: 8,
  },
  tableRowAlt: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.borderLight,
    paddingVertical: SPACING.rowPadding,
    fontSize: 8,
    backgroundColor: COLORS.rowHighlight,
  },
  tableCell: {
    textAlign: "center",
    paddingHorizontal: 2,
  },
  // Column widths for item placement table
  colSeq: { width: "6%" },
  colAwb: { width: "18%" },
  colPiece: { width: "8%" },
  colDimensions: { width: "15%" },
  colWeight: { width: "10%" },
  colPositionX: { width: "8%" },
  colPositionY: { width: "8%" },
  colPositionZ: { width: "8%" },
  colRotation: { width: "10%" },
  colShc: { width: "9%" },

  // ============================================================================
  // NOTES
  // ============================================================================
  notesContainer: {
    marginTop: 6,
    padding: 8,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: 4,
    backgroundColor: COLORS.rowHighlight,
  },
  noteCategory: {
    marginBottom: 6,
  },
  noteCategoryTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    marginBottom: 3,
  },
  noteItem: {
    fontSize: 8,
    marginLeft: 10,
    marginBottom: 2,
  },
  noteWarning: {
    color: COLORS.warning,
  },
  noteDanger: {
    color: COLORS.error,
  },

  // ============================================================================
  // SUMMARY
  // ============================================================================
  summaryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
    gap: 10,
  },
  summaryBox: {
    flex: 1,
    padding: 8,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: 4,
    alignItems: "center",
  },
  summaryValue: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
  },
  summaryLabel: {
    fontSize: 7,
    color: COLORS.secondaryText,
    marginTop: 2,
    textAlign: "center",
  },
  summarySubtext: {
    fontSize: 6,
    color: COLORS.mutedText,
    marginTop: 1,
  },
  summaryDetails: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  summaryDetailItem: {
    flexDirection: "row",
  },
  summaryDetailLabel: {
    fontSize: 8,
    color: COLORS.secondaryText,
  },
  summaryDetailValue: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    marginLeft: 4,
  },

  // ============================================================================
  // VERIFICATION
  // ============================================================================
  verificationSection: {
    marginTop: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  verificationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  verificationBox: {
    width: "45%",
  },
  verificationLine: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderDark,
    marginTop: 25,
    marginBottom: 4,
  },
  verificationLabel: {
    fontSize: 8,
    color: COLORS.secondaryText,
  },
  remarksBox: {
    marginTop: 10,
  },
  remarksLine: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    marginTop: 15,
  },

  // ============================================================================
  // FOOTER
  // ============================================================================
  footer: {
    position: "absolute",
    bottom: SPACING.pageMargin,
    left: SPACING.pageMargin,
    right: SPACING.pageMargin,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: 8,
    fontSize: 7,
    color: COLORS.secondaryText,
  },
});





