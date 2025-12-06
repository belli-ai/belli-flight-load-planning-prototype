"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Box,
  Eye,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Layers,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { UldAssignmentResult, PackedItemResult } from "../types";
import { MOCK_CARGO_ITEMS, getColorForAwb, MOCK_ULD_TYPES } from "../data/mock-data";

// ============================================================================
// TYPES
// ============================================================================

type UldVisualizationProps = {
  assignments: UldAssignmentResult[];
  selectedUldIndex?: number;
  onSelectUld?: (index: number) => void;
};

type PackedItemWithDetails = PackedItemResult & {
  awbNumber: string;
  description: string | null;
  color: string;
  weightKg: number;
};

// ============================================================================
// ISOMETRIC 3D VIEW COMPONENT
// ============================================================================

function IsometricUldView({
  assignment,
  scale = 0.5,
}: {
  assignment: UldAssignmentResult;
  scale?: number;
}) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Get ULD dimensions
  const uldType = MOCK_ULD_TYPES.find((t) => t.code === assignment.uldTypeCode);
  const uldDimensions = {
    length: uldType?.internalLengthCm || 156,
    width: uldType?.internalWidthCm || 153,
    height: uldType?.internalHeightCm || 163,
  };

  // Enrich cargo items with details
  const packedItems: PackedItemWithDetails[] = assignment.cargoItems.map((item) => {
    const cargo = MOCK_CARGO_ITEMS.find((c) => c.id === item.cargoItemId);
    return {
      ...item,
      awbNumber: cargo?.awbNumber || "Unknown",
      description: cargo?.description || null,
      color: getColorForAwb(cargo?.awbNumber || ""),
      weightKg: cargo?.weightKg || 0,
    };
  });

  // Convert 3D position to isometric 2D projection
  const toIsometric = (x: number, y: number, z: number) => {
    const isoX = (x - y) * Math.cos(Math.PI / 6) * scale;
    const isoY = (x + y) * Math.sin(Math.PI / 6) * scale - z * scale;
    return { x: isoX + 150, y: isoY + 200 };
  };

  // Draw isometric box
  const drawBox = (
    item: PackedItemWithDetails,
    index: number
  ): React.ReactNode => {
    const { position, dimensions } = item;
    const { x, y, z } = position;
    const { length, width, height } = dimensions;
    const isHovered = hoveredItem === item.cargoItemId;

    // Calculate corners for isometric projection
    const p1 = toIsometric(x, y, z);
    const p2 = toIsometric(x + length, y, z);
    const p3 = toIsometric(x + length, y + width, z);
    const p4 = toIsometric(x, y + width, z);
    const p5 = toIsometric(x, y, z + height);
    const p6 = toIsometric(x + length, y, z + height);
    const p7 = toIsometric(x + length, y + width, z + height);
    const p8 = toIsometric(x, y + width, z + height);

    // Create face paths
    const topFace = `M${p5.x},${p5.y} L${p6.x},${p6.y} L${p7.x},${p7.y} L${p8.x},${p8.y} Z`;
    const rightFace = `M${p2.x},${p2.y} L${p3.x},${p3.y} L${p7.x},${p7.y} L${p6.x},${p6.y} Z`;
    const leftFace = `M${p1.x},${p1.y} L${p2.x},${p2.y} L${p6.x},${p6.y} L${p5.x},${p5.y} Z`;

    // Color variations for 3D effect
    const baseColor = item.color;
    const topColor = baseColor;
    const rightColor = `${baseColor}cc`;
    const leftColor = `${baseColor}99`;

    return (
      <g
        key={item.cargoItemId}
        className="cursor-pointer transition-all duration-200"
        style={{
          filter: isHovered ? "brightness(1.2)" : "none",
          transform: isHovered ? "translateY(-2px)" : "none",
        }}
        onMouseEnter={() => setHoveredItem(item.cargoItemId)}
        onMouseLeave={() => setHoveredItem(null)}
      >
        <path
          d={leftFace}
          fill={leftColor}
          stroke={isHovered ? "#fff" : baseColor}
          strokeWidth={isHovered ? 2 : 0.5}
        />
        <path
          d={rightFace}
          fill={rightColor}
          stroke={isHovered ? "#fff" : baseColor}
          strokeWidth={isHovered ? 2 : 0.5}
        />
        <path
          d={topFace}
          fill={topColor}
          stroke={isHovered ? "#fff" : baseColor}
          strokeWidth={isHovered ? 2 : 0.5}
        />
      </g>
    );
  };

  // Draw ULD outline
  const drawUldOutline = () => {
    const { length, width, height } = uldDimensions;
    const p1 = toIsometric(0, 0, 0);
    const p2 = toIsometric(length, 0, 0);
    const p3 = toIsometric(length, width, 0);
    const p4 = toIsometric(0, width, 0);

    const floor = `M${p1.x},${p1.y} L${p2.x},${p2.y} L${p3.x},${p3.y} L${p4.x},${p4.y} Z`;

    return (
      <g className="uld-outline">
        <path
          d={floor}
          fill="none"
          stroke="currentColor"
          strokeWidth={1}
          strokeDasharray="4,4"
          className="text-muted-foreground/30"
        />
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((ratio) => {
          const gx = toIsometric(length * ratio, 0, 0);
          const gx2 = toIsometric(length * ratio, width, 0);
          const gy = toIsometric(0, width * ratio, 0);
          const gy2 = toIsometric(length, width * ratio, 0);
          return (
            <g key={ratio}>
              <line
                x1={gx.x}
                y1={gx.y}
                x2={gx2.x}
                y2={gx2.y}
                stroke="currentColor"
                strokeWidth={0.5}
                strokeDasharray="2,4"
                className="text-muted-foreground/20"
              />
              <line
                x1={gy.x}
                y1={gy.y}
                x2={gy2.x}
                y2={gy2.y}
                stroke="currentColor"
                strokeWidth={0.5}
                strokeDasharray="2,4"
                className="text-muted-foreground/20"
              />
            </g>
          );
        })}
      </g>
    );
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <svg viewBox="0 0 300 300" className="w-full h-full max-h-[300px]">
        {drawUldOutline()}
        {packedItems.map((item, index) => drawBox(item, index))}
      </svg>

      {/* Hover tooltip */}
      {hoveredItem && (
        <div className="absolute bottom-4 left-4 right-4 rounded-sm border border-border bg-popover p-3 shadow-lg">
          {(() => {
            const item = packedItems.find((i) => i.cargoItemId === hoveredItem);
            if (!item) return null;
            return (
              <div className="flex items-start gap-3">
                <div
                  className="mt-0.5 h-3 w-3 rounded-sm"
                  style={{ backgroundColor: item.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{item.awbNumber}</div>
                  <div className="text-xs text-muted-foreground">
                    {item.description || "General cargo"}
                  </div>
                  <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                    <span>{item.weightKg} kg</span>
                    <span>
                      {item.dimensions.length}×{item.dimensions.width}×
                      {item.dimensions.height} cm
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function UldVisualization({
  assignments,
  selectedUldIndex = 0,
  onSelectUld,
}: UldVisualizationProps) {
  const [viewMode, setViewMode] = useState<"isometric" | "top" | "side">("isometric");
  const [zoom, setZoom] = useState(1);

  const currentAssignment = assignments[selectedUldIndex];

  if (!currentAssignment) {
    return (
      <Card className="h-full flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <Box className="mx-auto mb-2 size-10 opacity-50" />
          <p className="text-sm">No ULD assignments to display</p>
        </div>
      </Card>
    );
  }

  const handlePrevUld = () => {
    if (selectedUldIndex > 0) {
      onSelectUld?.(selectedUldIndex - 1);
    }
  };

  const handleNextUld = () => {
    if (selectedUldIndex < assignments.length - 1) {
      onSelectUld?.(selectedUldIndex + 1);
    }
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Layers className="size-4 text-primary" />
            ULD Visualization
          </CardTitle>

          {/* ULD Navigation */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handlePrevUld}
              disabled={selectedUldIndex === 0}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="text-sm text-muted-foreground min-w-[60px] text-center">
              {selectedUldIndex + 1} / {assignments.length}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleNextUld}
              disabled={selectedUldIndex === assignments.length - 1}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>

        {/* ULD Info */}
        <div className="mt-2 flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Box className="size-4 text-primary" />
            <span className="font-medium">{currentAssignment.uldTypeCode}</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <span className="text-muted-foreground">
            Position: {currentAssignment.positionCode || "Unassigned"}
          </span>
          <div className="h-4 w-px bg-border" />
          <span className="text-muted-foreground">
            {currentAssignment.cargoItems.length} items
          </span>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-4">
        {/* View controls */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-1">
            {(["isometric", "top", "side"] as const).map((mode) => (
              <Button
                key={mode}
                variant={viewMode === mode ? "secondary" : "ghost"}
                size="sm"
                className="h-7 text-xs capitalize"
                onClick={() => setViewMode(mode)}
              >
                {mode}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
            >
              <ZoomOut className="size-3.5" />
            </Button>
            <span className="text-xs text-muted-foreground w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setZoom((z) => Math.min(2, z + 0.25))}
            >
              <ZoomIn className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setZoom(1)}
            >
              <RotateCcw className="size-3.5" />
            </Button>
          </div>
        </div>

        {/* Visualization area */}
        <div
          className="relative rounded-sm border border-border bg-background/50 overflow-hidden"
          style={{ height: "calc(100% - 40px)" }}
        >
          <div
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "center",
              transition: "transform 0.2s ease",
              height: "100%",
            }}
          >
            <IsometricUldView assignment={currentAssignment} scale={0.45} />
          </div>
        </div>
      </CardContent>

      {/* Stats footer */}
      <div className="border-t border-border px-4 py-3">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-primary">
              {Math.round(currentAssignment.volumeUtilization * 100)}%
            </div>
            <div className="text-[10px] uppercase text-muted-foreground">
              Volume Used
            </div>
          </div>
          <div>
            <div className="text-lg font-semibold">
              {currentAssignment.totalWeightKg.toLocaleString()}
            </div>
            <div className="text-[10px] uppercase text-muted-foreground">
              Weight (kg)
            </div>
          </div>
          <div>
            <div className="text-lg font-semibold text-primary">
              {Math.round(currentAssignment.weightUtilization * 100)}%
            </div>
            <div className="text-[10px] uppercase text-muted-foreground">
              Weight Cap
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

