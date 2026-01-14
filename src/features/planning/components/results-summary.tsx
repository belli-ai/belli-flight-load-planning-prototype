"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Box,
  FileText,
  Loader2,
  Sparkles,
  ChevronRight,
  AlertTriangle,
  Check,
  ArrowRight,
  Scale,
  Download,
} from "lucide-react";
import type {
  OptimizationResult,
  BuildUpInstruction,
  UldAssignmentResult,
} from "../types";
import type { CargoItemDisplay } from "@/features/cargo";
import { UldViewer3D } from "./uld-viewer-3d";
import {
  generateBuildUpPdf,
  downloadBuildUpPdf,
  getBuildUpPdfFilename,
  getCargoColor,
  type BuildUpPdfInput,
  type PackedItemData,
} from "../lib/build-up-pdf";

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Convert priority string to numeric value for PDF
 */
function getPriorityValue(priority?: string): number {
  switch (priority) {
    case "HIGH":
      return 90;
    case "MEDIUM":
      return 70;
    case "LOW":
      return 30;
    case "STANDARD":
    default:
      return 50;
  }
}

// ============================================================================
// TYPES
// ============================================================================

type ResultsSummaryProps = {
  result: OptimizationResult;
  selectedUldIndex: number;
  onSelectUld: (index: number) => void;
  onGenerateInstructions: (uldIndex: number) => Promise<void>;
  instructions: Map<number, BuildUpInstruction>;
  isGeneratingInstructions: boolean;
  cargoItems?: CargoItemDisplay[];
  /** Load plan ID for confirmation */
  loadPlanId?: string;
  /** Whether the build-up has been confirmed */
  isConfirmed?: boolean;
  /** Callback to confirm the build-up */
  onConfirm?: () => Promise<void>;
  /** Whether confirmation is in progress */
  isConfirming?: boolean;
  /** Flight information for PDF export */
  flightInfo?: {
    flightNumber: string;
    flightDate: Date;
    origin: string;
    destination: string;
    aircraftRegistration?: string;
    aircraftType?: string;
  };
};

// ============================================================================
// COMPONENT
// ============================================================================

export function ResultsSummary({
  result,
  selectedUldIndex,
  onSelectUld,
  onGenerateInstructions,
  instructions,
  isGeneratingInstructions,
  cargoItems = [],
  loadPlanId,
  isConfirmed = false,
  onConfirm,
  isConfirming = false,
  flightInfo,
}: ResultsSummaryProps) {
  const [expandedUld, setExpandedUld] = useState<number | null>(null);
  const [exportingUldIndex, setExportingUldIndex] = useState<number | null>(
    null
  );

  // Format number consistently for SSR/client hydration
  const formatNumber = (num: number) => num.toLocaleString("en-US");

  // Handle PDF export for a ULD
  const handleExportPdf = useCallback(
    async (assignment: UldAssignmentResult, uldIndex: number) => {
      if (!flightInfo) {
        console.warn("Flight info not available for PDF export");
        return;
      }

      setExportingUldIndex(uldIndex);

      try {
        // Build packed items data from assignment
        const packedItems: PackedItemData[] = assignment.cargoItems.map(
          (item, idx) => {
            // Find cargo item details
            const cargoItem = cargoItems.find((c) => c.id === item.cargoItemId);

            const isDangerousGoods = cargoItem?.isDangerousGoods ?? false;
            const shCodes = cargoItem?.specialHandling ?? [];
            const isPerishable = shCodes.some(
              (c: string) => c === "PER" || c === "PEP" || c === "PES"
            );
            const isFragile = shCodes.some(
              (c: string) => c === "FRA" || c === "FRG"
            );
            const isValuable = shCodes.some((c: string) => c === "VAL");
            const isTemperatureControlled = shCodes.some(
              (c: string) => c === "COL" || c === "FRO" || c === "TMP"
            );

            const packedItem: PackedItemData = {
              cargoItemId: item.cargoItemId,
              awbNumber: cargoItem?.awbNumber ?? "Unknown",
              pieceId: `P${String(cargoItem?.pieceNumber ?? idx + 1).padStart(
                3,
                "0"
              )}`,
              sequenceNumber: idx + 1,
              weightKg: cargoItem?.weightKg ?? 0,
              originalDimensions: {
                lengthCm: cargoItem?.lengthCm ?? item.dimensions.length,
                widthCm: cargoItem?.widthCm ?? item.dimensions.width,
                heightCm: cargoItem?.heightCm ?? item.dimensions.height,
              },
              packedDimensions: {
                lengthCm: item.dimensions.length,
                widthCm: item.dimensions.width,
                heightCm: item.dimensions.height,
              },
              position: {
                xCm: item.position.x,
                yCm: item.position.y,
                zCm: item.position.z,
              },
              rotationApplied: item.rotated
                ? item.rotationAxis === "Z"
                  ? "Z_90"
                  : item.rotationAxis === "X"
                  ? "X_90"
                  : item.rotationAxis === "Y"
                  ? "Y_90"
                  : "XY_SWAP"
                : "NONE",
              specialHandlingCodes: shCodes,
              isDangerousGoods,
              isPerishable,
              isFragile,
              isValuable,
              isTemperatureControlled,
              orientationRestricted:
                isFragile || shCodes.some((c: string) => c === "ORI"),
              priority: getPriorityValue(cargoItem?.priority),
              color: getCargoColor({
                isDangerousGoods,
                isPerishable,
                isValuable,
                isTemperatureControlled,
                priority: getPriorityValue(cargoItem?.priority),
              }),
            };

            return packedItem;
          }
        );

        // Build PDF input
        const uldNumber =
          assignment.uldNumber ||
          `${assignment.uldTypeCode}-${String(uldIndex + 1).padStart(
            5,
            "0"
          )}GA`;

        const pdfInput: BuildUpPdfInput = {
          flightNumber: flightInfo.flightNumber,
          flightDate: flightInfo.flightDate,
          origin: flightInfo.origin,
          destination: flightInfo.destination,
          aircraftRegistration: flightInfo.aircraftRegistration,
          aircraftType: flightInfo.aircraftType,
          uldAssignment: {
            uldTypeCode: assignment.uldTypeCode,
            uldNumber,
            positionCode: assignment.positionCode,
            tareWeightKg: 82, // Default tare weight for ULD
            maxGrossWeightKg: assignment.maxGrossWeightKg,
            dimensions: {
              lengthCm: assignment.uldDimensions.lengthCm,
              widthCm: assignment.uldDimensions.widthCm,
              heightCm: assignment.uldDimensions.heightCm,
            },
          },
          packedItems,
          totalWeightKg: assignment.totalWeightKg,
          volumeUtilization: assignment.volumeUtilization,
          weightUtilization: assignment.weightUtilization,
        };

        // Generate and download PDF
        const blob = await generateBuildUpPdf(pdfInput);
        const filename = getBuildUpPdfFilename(
          flightInfo.flightNumber,
          uldNumber,
          flightInfo.flightDate
        );
        downloadBuildUpPdf(blob, filename);
      } catch (error) {
        console.error("Failed to export PDF:", error);
      } finally {
        setExportingUldIndex(null);
      }
    },
    [flightInfo, cargoItems]
  );

  return (
    <div className="space-y-4">
      {/* 3D Visualization at top */}
      {result.assignments.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <UldViewer3D
              assignments={result.assignments}
              selectedUldIndex={selectedUldIndex}
              onSelectUld={onSelectUld}
              cargoItems={cargoItems}
            />
          </CardContent>
        </Card>
      )}

      {/* Optimization Results Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="size-4 text-primary" />
            Optimization Results
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Key metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-sm border border-border bg-card p-3 text-center">
              <div className="text-2xl font-bold text-primary">
                {result.stats.uldsUsed}
              </div>
              <div className="mt-1 text-[10px] uppercase text-muted-foreground tracking-wide">
                ULDs Used
              </div>
            </div>
            <div className="rounded-sm border border-border bg-card p-3 text-center">
              <div className="text-2xl font-bold">
                {Math.round(result.stats.avgVolumeUtilization * 100)}%
              </div>
              <div className="mt-1 text-[10px] uppercase text-muted-foreground tracking-wide">
                Avg Volume
              </div>
            </div>
            <div className="rounded-sm border border-border bg-card p-3 text-center">
              <div className="text-2xl font-bold">
                {Math.round(result.stats.avgWeightUtilization * 100)}%
              </div>
              <div className="mt-1 text-[10px] uppercase text-muted-foreground tracking-wide">
                Avg Weight
              </div>
            </div>
          </div>

          {/* ULD assignments list */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                ULD Assignments
              </span>
            </div>

            <div className="space-y-2">
              {result.assignments.map((assignment, index) => {
                const isExpanded = expandedUld === index;
                const isSelected = selectedUldIndex === index;
                const instruction = instructions.get(index);

                return (
                  <div
                    key={index}
                    className={cn(
                      "rounded-sm border overflow-hidden transition-colors",
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border"
                    )}
                  >
                    {/* ULD header */}
                    <button
                      onClick={() => {
                        onSelectUld(index);
                        setExpandedUld(isExpanded ? null : index);
                      }}
                      className="flex w-full items-center gap-3 p-3 text-left hover:bg-muted/30 transition-colors"
                    >
                      <div
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-sm",
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "bg-primary/10"
                        )}
                      >
                        <Box className="size-4" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {assignment.uldNumber || assignment.uldTypeCode}
                          </span>
                          {!assignment.uldNumber && (
                            <span className="text-[10px] text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">
                              Virtual
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            @ {assignment.positionCode || "Unassigned"}
                          </span>
                        </div>
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span>{assignment.cargoItems.length} items</span>
                          <span>
                            {formatNumber(assignment.totalWeightKg)} kg
                          </span>
                          <span>
                            {Math.round(assignment.volumeUtilization * 100)}%
                            vol
                          </span>
                        </div>
                      </div>

                      <ChevronRight
                        className={cn(
                          "size-4 text-muted-foreground transition-transform",
                          isExpanded && "rotate-90"
                        )}
                      />
                    </button>

                    {/* Expanded content */}
                    {isExpanded && (
                      <div className="border-t border-border bg-muted/20 p-3 space-y-3">
                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => onGenerateInstructions(index)}
                            disabled={isGeneratingInstructions}
                          >
                            {isGeneratingInstructions ? (
                              <Loader2 className="mr-1.5 size-3 animate-spin" />
                            ) : (
                              <Sparkles className="mr-1.5 size-3" />
                            )}
                            {instruction ? "Regenerate" : "Generate"}{" "}
                            Instructions
                          </Button>

                          {/* Export PDF Button */}
                          {flightInfo && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs"
                              onClick={() => handleExportPdf(assignment, index)}
                              disabled={exportingUldIndex === index}
                            >
                              {exportingUldIndex === index ? (
                                <Loader2 className="mr-1.5 size-3 animate-spin" />
                              ) : (
                                <Download className="mr-1.5 size-3" />
                              )}
                              Export PDF
                            </Button>
                          )}
                        </div>

                        {/* Build-up instructions */}
                        {instruction && (
                          <div className="rounded-sm border border-border bg-background p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <FileText className="size-4 text-primary" />
                              <span className="text-xs font-medium">
                                Build-Up Instructions
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                ~{instruction.estimatedBuildTimeMinutes} min
                              </span>
                            </div>

                            <ol className="space-y-2">
                              {instruction.steps.map((step) => (
                                <li
                                  key={step.sequence}
                                  className="flex gap-2 text-xs"
                                >
                                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-medium text-primary shrink-0">
                                    {step.sequence}
                                  </span>
                                  <div>
                                    <div className="font-medium">
                                      {step.action}
                                    </div>
                                    <div className="text-muted-foreground">
                                      {step.cargoDescription} ({step.awbNumber})
                                      - {step.weightKg}kg
                                    </div>
                                    {step.warnings &&
                                      step.warnings.length > 0 && (
                                        <div className="mt-1 flex items-center gap-1 text-amber-400">
                                          <AlertTriangle className="size-3" />
                                          <span className="text-[10px]">
                                            {step.warnings[0]}
                                          </span>
                                        </div>
                                      )}
                                  </div>
                                </li>
                              ))}
                            </ol>

                            {instruction.notes.length > 0 && (
                              <div className="mt-3 pt-2 border-t border-border">
                                <div className="text-[10px] text-muted-foreground uppercase mb-1">
                                  Notes
                                </div>
                                <ul className="text-xs text-muted-foreground space-y-0.5">
                                  {instruction.notes.map((note, i) => (
                                    <li key={i}>• {note}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Warnings */}
          {result.warnings.length > 0 && (
            <div className="rounded-sm border border-amber-500/30 bg-amber-500/5 p-3">
              <div className="flex items-center gap-2 text-amber-400 mb-2">
                <AlertTriangle className="size-4" />
                <span className="text-sm font-medium">Warnings</span>
              </div>
              <ul className="text-xs text-muted-foreground space-y-1">
                {result.warnings.map((warning, i) => (
                  <li key={i}>• {warning}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Unassigned cargo */}
          {result.unassignedCargoIds.length > 0 && (
            <div className="rounded-sm border border-red-500/30 bg-red-500/5 p-3">
              <div className="flex items-center gap-2 text-red-400 mb-2">
                <AlertTriangle className="size-4" />
                <span className="text-sm font-medium">
                  {result.unassignedCargoIds.length} items could not be assigned
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                These items may exceed ULD capacity, violate packing
                constraints, or there may not be enough ULDs available at the
                origin.
              </p>

              {/* List unassigned cargo items */}
              {cargoItems.length > 0 && (
                <div className="space-y-2 mt-2">
                  {result.unassignedCargoIds
                    .slice(0, 10) // Show max 10 items
                    .map((cargoId) => {
                      const cargo = cargoItems.find((c) => c.id === cargoId);
                      if (!cargo) return null;
                      return (
                        <div
                          key={cargoId}
                          className="flex items-center justify-between rounded-sm border border-red-500/20 bg-background/50 p-2"
                        >
                          <div className="flex items-center gap-2">
                            <Box className="size-3.5 text-red-400" />
                            <span className="text-xs font-medium">
                              {cargo.awbNumber}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Pc {cargo.pieceNumber}
                            </span>
                          </div>
                          <div className="flex gap-3 text-xs text-muted-foreground">
                            <span>{cargo.weightKg} kg</span>
                            <span>
                              {cargo.lengthCm}×{cargo.widthCm}×{cargo.heightCm}{" "}
                              cm
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  {result.unassignedCargoIds.length > 10 && (
                    <div className="text-xs text-muted-foreground text-center pt-1">
                      ... and {result.unassignedCargoIds.length - 10} more items
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Confirmation Section */}
          {loadPlanId && (
            <div className="border-t border-border pt-4 mt-4">
              {isConfirmed ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-green-400">
                    <Check className="size-5" />
                    <span className="font-medium">Build-Up Plan Confirmed</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    The build-up plan has been saved. You can now proceed to
                    load balancing.
                  </p>
                  <Button asChild className="w-full">
                    <Link
                      href={`/dashboard/load-balancing?loadPlanId=${loadPlanId}`}
                    >
                      <Scale className="mr-2 size-4" />
                      Go to Load Balancing
                      <ArrowRight className="ml-2 size-4" />
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Review the build-up plan above. Once confirmed, the plan
                    will be saved and you can proceed to load balancing.
                  </p>
                  <Button
                    onClick={onConfirm}
                    disabled={isConfirming || !onConfirm}
                    className="w-full"
                  >
                    {isConfirming ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Confirming...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 size-4" />
                        Confirm Build-Up Plan
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
