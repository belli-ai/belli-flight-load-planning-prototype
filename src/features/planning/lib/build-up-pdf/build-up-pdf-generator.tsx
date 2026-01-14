/**
 * Build-Up PDF Generator
 *
 * Generates ULD Build-Up Instructions PDF for ground handlers
 * Based on BUILD_UP_PLAN_PDF_SPEC.md
 */

"use client";

import {
  Document,
  Page,
  Text,
  View,
  pdf,
  Svg,
  Rect,
} from "@react-pdf/renderer";
import { styles, COLORS } from "./styles";
import type { BuildUpPdfInput, PackedItemData } from "./types";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatDate(date: Date): string {
  return date
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    .toUpperCase();
}

function formatWeight(kg: number): string {
  return kg.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function formatRotation(rotation: string): string {
  switch (rotation) {
    case "NONE":
      return "None";
    case "Z_90":
      return "Z-90°";
    case "Z_180":
      return "Z-180°";
    case "Z_270":
      return "Z-270°";
    case "XY_SWAP":
      return "XY Swap";
    case "X_90":
      return "X-90°";
    case "Y_90":
      return "Y-90°";
    default:
      return rotation;
  }
}

function formatShc(codes: string[]): string {
  if (codes.length === 0) return "—";
  return codes.slice(0, 3).join(" ");
}

// ============================================================================
// HEADER SECTION
// ============================================================================

function HeaderSection({ data }: { data: BuildUpPdfInput }) {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>ULD BUILD-UP INSTRUCTION SHEET</Text>
      <Text style={styles.headerSubtitle}>
        For Operational Use - Ground Handler Reference
      </Text>

      <View style={styles.headerRow}>
        <View style={styles.headerInfo}>
          <View>
            <Text style={styles.headerLabel}>Flight</Text>
            <Text style={styles.headerValue}>{data.flightNumber}</Text>
          </View>
          <View>
            <Text style={styles.headerLabel}>Date</Text>
            <Text style={styles.headerValue}>
              {formatDate(data.flightDate)}
            </Text>
          </View>
          <View>
            <Text style={styles.headerLabel}>Route</Text>
            <Text style={styles.headerValue}>
              {data.origin} → {data.destination}
            </Text>
          </View>
          {data.aircraftRegistration && (
            <View>
              <Text style={styles.headerLabel}>Aircraft</Text>
              <Text style={styles.headerValue}>
                {data.aircraftRegistration}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.uldInfo}>
        <View style={styles.uldInfoItem}>
          <Text style={styles.headerLabel}>ULD Type</Text>
          <Text style={styles.headerValue}>
            {data.uldAssignment.uldTypeCode}
          </Text>
        </View>
        <View style={styles.uldInfoItem}>
          <Text style={styles.headerLabel}>ULD Number</Text>
          <Text style={styles.headerValue}>{data.uldAssignment.uldNumber}</Text>
        </View>
        <View style={styles.uldInfoItem}>
          <Text style={styles.headerLabel}>Aircraft Position</Text>
          <Text style={styles.headerValue}>
            {data.uldAssignment.positionCode || "TBD"}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ============================================================================
// ULD VISUALIZATION SECTION
// ============================================================================

function UldVisualizationSection({ data }: { data: BuildUpPdfInput }) {
  const { uldAssignment, packedItems } = data;
  const { dimensions } = uldAssignment;

  // Scale factor for visualization (fit within 300pt width)
  const maxWidth = 300;
  const maxHeight = 150;
  const scaleX = maxWidth / dimensions.lengthCm;
  const scaleY = maxHeight / dimensions.widthCm;
  const scale = Math.min(scaleX, scaleY) * 0.9;

  const scaledWidth = dimensions.lengthCm * scale;
  const scaledHeight = dimensions.widthCm * scale;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>ULD TOP-DOWN VIEW</Text>
      <View style={styles.visualizationContainer}>
        <Text style={styles.visualizationTitle}>
          Loading direction → (Front to Back)
        </Text>

        <Svg width={scaledWidth + 20} height={scaledHeight + 20}>
          {/* ULD Outline */}
          <Rect
            x={10}
            y={10}
            width={scaledWidth}
            height={scaledHeight}
            fill="#FAFAFA"
            stroke="#000000"
            strokeWidth={1}
          />

          {/* Packed Items */}
          {packedItems.map((item, idx) => {
            const x = 10 + item.position.xCm * scale;
            const y = 10 + item.position.yCm * scale;
            const w = item.packedDimensions.lengthCm * scale;
            const h = item.packedDimensions.widthCm * scale;

            return (
              <Rect
                key={idx}
                x={x}
                y={y}
                width={w}
                height={h}
                fill={item.color}
                stroke="#333333"
                strokeWidth={0.5}
              />
            );
          })}
        </Svg>

        <Text style={styles.dimensionLabel}>
          Dimensions: {dimensions.lengthCm} × {dimensions.widthCm} ×{" "}
          {dimensions.heightCm} cm (L × W × H)
        </Text>
      </View>
    </View>
  );
}

// ============================================================================
// ITEM PLACEMENT TABLE SECTION
// ============================================================================

function ItemPlacementTable({ data }: { data: BuildUpPdfInput }) {
  const { packedItems } = data;

  // Sort by sequence number
  const sortedItems = [...packedItems].sort(
    (a, b) => a.sequenceNumber - b.sequenceNumber
  );

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>ITEM PLACEMENT TABLE</Text>

      <View style={styles.table}>
        {/* Header */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableCell, styles.colSeq]}>SEQ</Text>
          <Text style={[styles.tableCell, styles.colAwb]}>AWB NUMBER</Text>
          <Text style={[styles.tableCell, styles.colPiece]}>PC ID</Text>
          <Text style={[styles.tableCell, styles.colDimensions]}>
            DIMENSIONS
          </Text>
          <Text style={[styles.tableCell, styles.colWeight]}>WEIGHT</Text>
          <Text style={[styles.tableCell, styles.colPositionX]}>X</Text>
          <Text style={[styles.tableCell, styles.colPositionY]}>Y</Text>
          <Text style={[styles.tableCell, styles.colPositionZ]}>Z</Text>
          <Text style={[styles.tableCell, styles.colRotation]}>ROTATION</Text>
          <Text style={[styles.tableCell, styles.colShc]}>SHC</Text>
        </View>

        {/* Rows */}
        {sortedItems.map((item, idx) => (
          <View
            key={item.cargoItemId}
            style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
          >
            <Text style={[styles.tableCell, styles.colSeq]}>
              {item.sequenceNumber}
            </Text>
            <Text style={[styles.tableCell, styles.colAwb]}>
              {item.awbNumber}
            </Text>
            <Text style={[styles.tableCell, styles.colPiece]}>
              {item.pieceId}
            </Text>
            <Text style={[styles.tableCell, styles.colDimensions]}>
              {item.packedDimensions.lengthCm}×{item.packedDimensions.widthCm}×
              {item.packedDimensions.heightCm}
            </Text>
            <Text style={[styles.tableCell, styles.colWeight]}>
              {formatWeight(item.weightKg)}
            </Text>
            <Text style={[styles.tableCell, styles.colPositionX]}>
              {Math.round(item.position.xCm)}
            </Text>
            <Text style={[styles.tableCell, styles.colPositionY]}>
              {Math.round(item.position.yCm)}
            </Text>
            <Text style={[styles.tableCell, styles.colPositionZ]}>
              {Math.round(item.position.zCm)}
            </Text>
            <Text style={[styles.tableCell, styles.colRotation]}>
              {formatRotation(item.rotationApplied)}
            </Text>
            <Text style={[styles.tableCell, styles.colShc]}>
              {formatShc(item.specialHandlingCodes)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ============================================================================
// BUILD-UP NOTES SECTION
// ============================================================================

function BuildUpNotesSection({ data }: { data: BuildUpPdfInput }) {
  const { packedItems, instructions } = data;

  // Generate notes based on cargo characteristics
  const notes: { category: string; items: string[] }[] = [];

  // Loading sequence note (always shown)
  notes.push({
    category: "⚠ LOADING SEQUENCE",
    items: [
      `Load items in sequence order (1 → ${packedItems.length})`,
      "Heavy items positioned at bottom layer",
    ],
  });

  // Heavy cargo notes
  const heavyItems = packedItems.filter((item) => item.weightKg > 100);
  if (heavyItems.length > 0) {
    notes.push({
      category: "⚡ HEAVY CARGO",
      items: heavyItems.map(
        (item) =>
          `${item.pieceId}: ${formatWeight(
            item.weightKg
          )} kg - Use lifting equipment`
      ),
    });
  }

  // Dangerous goods notes
  const dgItems = packedItems.filter((item) => item.isDangerousGoods);
  if (dgItems.length > 0) {
    notes.push({
      category: "☢ DANGEROUS GOODS",
      items: dgItems.map(
        (item) =>
          `${item.pieceId} (${item.awbNumber}): Handle per DG regulations`
      ),
    });
  }

  // Perishable notes
  const perishableItems = packedItems.filter((item) => item.isPerishable);
  if (perishableItems.length > 0) {
    notes.push({
      category: "❄ PERISHABLE",
      items: [
        ...perishableItems.map(
          (item) => `${item.pieceId}: Minimize exposure time`
        ),
      ],
    });
  }

  // Temperature controlled notes
  const tempItems = packedItems.filter((item) => item.isTemperatureControlled);
  if (tempItems.length > 0) {
    notes.push({
      category: "🌡 TEMPERATURE CONTROLLED",
      items: tempItems.map(
        (item) => `${item.pieceId}: Maintain temperature requirements`
      ),
    });
  }

  // Orientation restricted notes
  const orientationItems = packedItems.filter(
    (item) => item.orientationRestricted
  );
  if (orientationItems.length > 0) {
    notes.push({
      category: "↑ ORIENTATION",
      items: [
        "Maintain marked orientation (THIS SIDE UP)",
        ...orientationItems.map((item) => `${item.pieceId}: Keep upright`),
      ],
    });
  }

  // Fragile items
  const fragileItems = packedItems.filter((item) => item.isFragile);
  if (fragileItems.length > 0) {
    notes.push({
      category: "⚠ FRAGILE",
      items: fragileItems.map(
        (item) => `${item.pieceId}: Do not stack heavy items on top`
      ),
    });
  }

  // Add LLM-generated notes if available
  if (instructions?.notes && instructions.notes.length > 0) {
    notes.push({
      category: "📋 ADDITIONAL NOTES",
      items: instructions.notes,
    });
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>BUILD-UP NOTES</Text>
      <View style={styles.notesContainer}>
        {notes.map((noteGroup, idx) => (
          <View key={idx} style={styles.noteCategory}>
            <Text style={styles.noteCategoryTitle}>{noteGroup.category}</Text>
            {noteGroup.items.map((item, itemIdx) => (
              <Text key={itemIdx} style={styles.noteItem}>
                • {item}
              </Text>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

// ============================================================================
// SUMMARY SECTION
// ============================================================================

function SummarySection({ data }: { data: BuildUpPdfInput }) {
  const {
    uldAssignment,
    packedItems,
    totalWeightKg,
    volumeUtilization,
    weightUtilization,
  } = data;

  // Count unique AWBs
  const uniqueAwbs = new Set(packedItems.map((item) => item.awbNumber)).size;

  // Calculate gross weight (tare + cargo)
  const grossWeightKg = uldAssignment.tareWeightKg + totalWeightKg;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>ULD SUMMARY</Text>

      <View style={styles.summaryContainer}>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryValue}>
            {formatWeight(totalWeightKg)} kg
          </Text>
          <Text style={styles.summaryLabel}>TOTAL CARGO WEIGHT</Text>
          <Text style={styles.summarySubtext}>
            Max:{" "}
            {formatWeight(
              uldAssignment.maxGrossWeightKg - uldAssignment.tareWeightKg
            )}{" "}
            kg
          </Text>
        </View>

        <View style={styles.summaryBox}>
          <Text style={styles.summaryValue}>
            {Math.round(volumeUtilization * 100)}%
          </Text>
          <Text style={styles.summaryLabel}>VOLUME UTILIZATION</Text>
        </View>

        <View style={styles.summaryBox}>
          <Text style={styles.summaryValue}>
            {Math.round(weightUtilization * 100)}%
          </Text>
          <Text style={styles.summaryLabel}>WEIGHT UTILIZATION</Text>
        </View>
      </View>

      <View style={styles.summaryDetails}>
        <View style={styles.summaryDetailItem}>
          <Text style={styles.summaryDetailLabel}>Items:</Text>
          <Text style={styles.summaryDetailValue}>
            {packedItems.length} pieces from {uniqueAwbs} AWBs
          </Text>
        </View>
        <View style={styles.summaryDetailItem}>
          <Text style={styles.summaryDetailLabel}>ULD Tare Weight:</Text>
          <Text style={styles.summaryDetailValue}>
            {formatWeight(uldAssignment.tareWeightKg)} kg
          </Text>
        </View>
        <View style={styles.summaryDetailItem}>
          <Text style={styles.summaryDetailLabel}>Gross Weight:</Text>
          <Text style={styles.summaryDetailValue}>
            {formatWeight(grossWeightKg)} kg
          </Text>
        </View>
      </View>
    </View>
  );
}

// ============================================================================
// VERIFICATION SECTION
// ============================================================================

function VerificationSection() {
  return (
    <View style={styles.verificationSection}>
      <Text style={styles.sectionTitle}>VERIFICATION</Text>

      <View style={styles.verificationRow}>
        <View style={styles.verificationBox}>
          <View style={styles.verificationLine} />
          <Text style={styles.verificationLabel}>
            Prepared By: _________________ Date/Time: _____________
          </Text>
        </View>
        <View style={styles.verificationBox}>
          <View style={styles.verificationLine} />
          <Text style={styles.verificationLabel}>
            Verified By: _________________ Date/Time: _____________
          </Text>
        </View>
      </View>

      <View style={styles.remarksBox}>
        <Text style={styles.verificationLabel}>Remarks:</Text>
        <View style={styles.remarksLine} />
        <View style={styles.remarksLine} />
      </View>
    </View>
  );
}

// ============================================================================
// FOOTER SECTION
// ============================================================================

function FooterSection() {
  return (
    <View style={styles.footer}>
      <Text>Generated: {new Date().toISOString()}</Text>
      <Text>ULD Build-Up Instruction Sheet</Text>
      <Text>Page 1 of 1</Text>
    </View>
  );
}

// ============================================================================
// MAIN DOCUMENT COMPONENT
// ============================================================================

function BuildUpDocument({ data }: { data: BuildUpPdfInput }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <HeaderSection data={data} />
        <UldVisualizationSection data={data} />
        <ItemPlacementTable data={data} />
        <BuildUpNotesSection data={data} />
        <SummarySection data={data} />
        <VerificationSection />
        <FooterSection />
      </Page>
    </Document>
  );
}

// ============================================================================
// EXPORT FUNCTIONS
// ============================================================================

/**
 * Generate Build-Up PDF as Blob
 */
export async function generateBuildUpPdf(data: BuildUpPdfInput): Promise<Blob> {
  const doc = <BuildUpDocument data={data} />;
  const blob = await pdf(doc).toBlob();
  return blob;
}

/**
 * Download Build-Up PDF
 */
export function downloadBuildUpPdf(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate filename for Build-Up PDF
 * Format: BuildUp_<FlightNumber>_<ULDNumber>_<Date>.pdf
 */
export function getBuildUpPdfFilename(
  flightNumber: string,
  uldNumber: string,
  date: Date
): string {
  const dateStr = date.toISOString().split("T")[0];
  const sanitizedUldNumber = uldNumber.replace(/[^a-zA-Z0-9-]/g, "_");
  return `BuildUp_${flightNumber}_${sanitizedUldNumber}_${dateStr}.pdf`;
}





