"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type {
  CgEnvelopeWithPoints,
  CgResult,
  WeightBreakdown,
} from "../types";

// ============================================================================
// TYPES
// ============================================================================

type CgPoint = {
  type: "ZFW" | "TOW" | "LDW";
  weightKg: number;
  cgPercentMac: number;
  label: string;
  color: string;
};

type CgEnvelopeChartProps = {
  envelope?: CgEnvelopeWithPoints;
  cgPoints?: CgPoint[];
  weights?: Partial<WeightBreakdown>;
  cgResults?: {
    zfwCg?: Partial<CgResult>;
    towCg?: Partial<CgResult>;
    ldwCg?: Partial<CgResult>;
  };
  className?: string;
  showLegend?: boolean;
  compact?: boolean;
};

// ============================================================================
// CONSTANTS
// ============================================================================

const CHART_CONFIG = {
  width: 400,
  height: 300,
  padding: { top: 30, right: 30, bottom: 50, left: 60 },
  // Default envelope bounds (A321 typical)
  defaultWeightRange: { min: 45000, max: 85000 },
  defaultCgRange: { min: 15, max: 40 },
};

// Default envelope points for A321 (approximate)
const DEFAULT_ENVELOPE_POINTS = [
  { sequence: 1, weightKg: 48000, cgPercentMac: 17 },
  { sequence: 2, weightKg: 63000, cgPercentMac: 17 },
  { sequence: 3, weightKg: 77000, cgPercentMac: 20 },
  { sequence: 4, weightKg: 77000, cgPercentMac: 35 },
  { sequence: 5, weightKg: 63000, cgPercentMac: 38 },
  { sequence: 6, weightKg: 48000, cgPercentMac: 38 },
];

const POINT_COLORS = {
  ZFW: "#22c55e", // Green
  TOW: "#3b82f6", // Blue
  LDW: "#f97316", // Orange
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function scaleX(
  cgPercent: number,
  cgRange: { min: number; max: number },
  chartWidth: number
): number {
  const { padding } = CHART_CONFIG;
  const availableWidth = chartWidth - padding.left - padding.right;
  return (
    padding.left +
    ((cgPercent - cgRange.min) / (cgRange.max - cgRange.min)) * availableWidth
  );
}

function scaleY(
  weightKg: number,
  weightRange: { min: number; max: number },
  chartHeight: number
): number {
  const { padding } = CHART_CONFIG;
  const availableHeight = chartHeight - padding.top - padding.bottom;
  // Invert Y axis (higher weight at top)
  return (
    padding.top +
    availableHeight -
    ((weightKg - weightRange.min) / (weightRange.max - weightRange.min)) *
      availableHeight
  );
}

function formatWeight(kg: number): string {
  if (kg >= 1000) {
    return `${(kg / 1000).toFixed(0)}k`;
  }
  return kg.toFixed(0);
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CgEnvelopeChart({
  envelope,
  cgPoints = [],
  weights,
  cgResults,
  className,
  showLegend = true,
  compact = false,
}: CgEnvelopeChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<string | null>(null);

  // Use provided envelope points or defaults
  const envelopePoints = useMemo(() => {
    if (envelope?.points && envelope.points.length > 0) {
      return [...envelope.points].sort((a, b) => a.sequence - b.sequence);
    }
    return DEFAULT_ENVELOPE_POINTS;
  }, [envelope]);

  // Calculate chart dimensions
  const chartWidth = compact ? 300 : CHART_CONFIG.width;
  const chartHeight = compact ? 200 : CHART_CONFIG.height;

  // Calculate ranges from envelope points
  const { weightRange, cgRange } = useMemo(() => {
    const weights = envelopePoints.map((p) => p.weightKg);
    const cgs = envelopePoints.map((p) => p.cgPercentMac);

    return {
      weightRange: {
        min: Math.min(...weights) - 5000,
        max: Math.max(...weights) + 5000,
      },
      cgRange: {
        min: Math.min(...cgs) - 3,
        max: Math.max(...cgs) + 3,
      },
    };
  }, [envelopePoints]);

  // Build CG points from results if not provided directly
  const allCgPoints = useMemo(() => {
    if (cgPoints.length > 0) return cgPoints;

    const points: CgPoint[] = [];

    if (weights?.zeroFuelWeightKg && cgResults?.zfwCg?.cgPercentMac) {
      points.push({
        type: "ZFW",
        weightKg: weights.zeroFuelWeightKg,
        cgPercentMac: cgResults.zfwCg.cgPercentMac,
        label: "Zero Fuel Weight",
        color: POINT_COLORS.ZFW,
      });
    }

    if (weights?.takeoffWeightKg && cgResults?.towCg?.cgPercentMac) {
      points.push({
        type: "TOW",
        weightKg: weights.takeoffWeightKg,
        cgPercentMac: cgResults.towCg.cgPercentMac,
        label: "Takeoff Weight",
        color: POINT_COLORS.TOW,
      });
    }

    if (weights?.landingWeightKg && cgResults?.ldwCg?.cgPercentMac) {
      points.push({
        type: "LDW",
        weightKg: weights.landingWeightKg,
        cgPercentMac: cgResults.ldwCg.cgPercentMac,
        label: "Landing Weight",
        color: POINT_COLORS.LDW,
      });
    }

    return points;
  }, [cgPoints, weights, cgResults]);

  // Generate envelope polygon path
  const envelopePath = useMemo(() => {
    if (envelopePoints.length < 3) return "";

    const points = envelopePoints.map((p) => ({
      x: scaleX(p.cgPercentMac, cgRange, chartWidth),
      y: scaleY(p.weightKg, weightRange, chartHeight),
    }));

    return (
      `M ${points[0].x},${points[0].y} ` +
      points
        .slice(1)
        .map((p) => `L ${p.x},${p.y}`)
        .join(" ") +
      " Z"
    );
  }, [envelopePoints, cgRange, weightRange, chartWidth, chartHeight]);

  // Generate grid lines
  const gridLines = useMemo(() => {
    const { padding } = CHART_CONFIG;
    const lines: { x1: number; y1: number; x2: number; y2: number; label: string; isVertical: boolean }[] = [];

    // Horizontal lines (weight)
    const weightStep = compact ? 15000 : 10000;
    for (
      let w = Math.ceil(weightRange.min / weightStep) * weightStep;
      w <= weightRange.max;
      w += weightStep
    ) {
      const y = scaleY(w, weightRange, chartHeight);
      lines.push({
        x1: padding.left,
        y1: y,
        x2: chartWidth - padding.right,
        y2: y,
        label: formatWeight(w),
        isVertical: false,
      });
    }

    // Vertical lines (CG %)
    const cgStep = 5;
    for (
      let cg = Math.ceil(cgRange.min / cgStep) * cgStep;
      cg <= cgRange.max;
      cg += cgStep
    ) {
      const x = scaleX(cg, cgRange, chartWidth);
      lines.push({
        x1: x,
        y1: padding.top,
        x2: x,
        y2: chartHeight - padding.bottom,
        label: `${cg}%`,
        isVertical: true,
      });
    }

    return lines;
  }, [weightRange, cgRange, chartWidth, chartHeight, compact]);

  return (
    <div className={cn("relative", className)}>
      <svg
        width={chartWidth}
        height={chartHeight}
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="overflow-visible"
      >
        {/* Background */}
        <rect
          x={CHART_CONFIG.padding.left}
          y={CHART_CONFIG.padding.top}
          width={chartWidth - CHART_CONFIG.padding.left - CHART_CONFIG.padding.right}
          height={chartHeight - CHART_CONFIG.padding.top - CHART_CONFIG.padding.bottom}
          fill="#0a0a0a"
          rx={4}
        />

        {/* Grid lines */}
        {gridLines.map((line, idx) => (
          <g key={idx}>
            <line
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke="#1f2937"
              strokeWidth={1}
              strokeDasharray={line.isVertical ? "4,4" : "none"}
            />
            {/* Labels */}
            {!line.isVertical && (
              <text
                x={CHART_CONFIG.padding.left - 8}
                y={line.y1}
                textAnchor="end"
                dominantBaseline="middle"
                fill="#6b7280"
                fontSize={compact ? 9 : 10}
              >
                {line.label}
              </text>
            )}
            {line.isVertical && (
              <text
                x={line.x1}
                y={chartHeight - CHART_CONFIG.padding.bottom + 15}
                textAnchor="middle"
                fill="#6b7280"
                fontSize={compact ? 9 : 10}
              >
                {line.label}
              </text>
            )}
          </g>
        ))}

        {/* Envelope polygon */}
        <path
          d={envelopePath}
          fill="rgba(34, 197, 94, 0.15)"
          stroke="#22c55e"
          strokeWidth={2}
        />

        {/* Forward/Aft limit labels */}
        {!compact && (
          <>
            <text
              x={scaleX(cgRange.min + 3, cgRange, chartWidth)}
              y={chartHeight - 15}
              textAnchor="middle"
              fill="#6b7280"
              fontSize={10}
            >
              ← FWD
            </text>
            <text
              x={scaleX(cgRange.max - 3, cgRange, chartWidth)}
              y={chartHeight - 15}
              textAnchor="middle"
              fill="#6b7280"
              fontSize={10}
            >
              AFT →
            </text>
          </>
        )}

        {/* CG Points */}
        {allCgPoints.map((point) => {
          const x = scaleX(point.cgPercentMac, cgRange, chartWidth);
          const y = scaleY(point.weightKg, weightRange, chartHeight);
          const isHovered = hoveredPoint === point.type;

          return (
            <g
              key={point.type}
              onMouseEnter={() => setHoveredPoint(point.type)}
              onMouseLeave={() => setHoveredPoint(null)}
              style={{ cursor: "pointer" }}
            >
              {/* Point marker */}
              <circle
                cx={x}
                cy={y}
                r={isHovered ? 8 : 6}
                fill={point.color}
                stroke="#ffffff"
                strokeWidth={2}
                style={{ transition: "r 0.15s ease" }}
              />

              {/* Label */}
              <text
                x={x}
                y={y - 12}
                textAnchor="middle"
                fill={point.color}
                fontSize={compact ? 9 : 11}
                fontWeight="600"
              >
                {point.type}
              </text>

              {/* Hover tooltip */}
              {isHovered && (
                <g>
                  <rect
                    x={x - 50}
                    y={y + 15}
                    width={100}
                    height={36}
                    fill="#1f2937"
                    stroke="#374151"
                    rx={4}
                  />
                  <text
                    x={x}
                    y={y + 30}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize={10}
                  >
                    {point.weightKg.toLocaleString()} kg
                  </text>
                  <text
                    x={x}
                    y={y + 44}
                    textAnchor="middle"
                    fill="#9ca3af"
                    fontSize={10}
                  >
                    {point.cgPercentMac.toFixed(1)}% MAC
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Axis labels */}
        <text
          x={CHART_CONFIG.padding.left - 45}
          y={chartHeight / 2}
          textAnchor="middle"
          fill="#9ca3af"
          fontSize={11}
          transform={`rotate(-90, ${CHART_CONFIG.padding.left - 45}, ${chartHeight / 2})`}
        >
          Weight (kg)
        </text>
        <text
          x={chartWidth / 2}
          y={chartHeight - 5}
          textAnchor="middle"
          fill="#9ca3af"
          fontSize={11}
        >
          CG Position (% MAC)
        </text>
      </svg>

      {/* Legend */}
      {showLegend && allCgPoints.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-4 justify-center text-xs">
          {allCgPoints.map((point) => (
            <div key={point.type} className="flex items-center gap-1.5">
              <div
                className="size-2.5 rounded-full"
                style={{ backgroundColor: point.color }}
              />
              <span className="text-muted-foreground">
                {point.label}: {point.weightKg.toLocaleString()} kg @{" "}
                {point.cgPercentMac.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Envelope status */}
      {allCgPoints.length > 0 && (
        <div className="mt-2 text-center">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium",
              allCgPoints.every((p) => {
                // Simple check if within envelope bounds
                const inBounds =
                  p.cgPercentMac >= cgRange.min + 3 &&
                  p.cgPercentMac <= cgRange.max - 3;
                return inBounds;
              })
                ? "bg-green-500/10 text-green-500"
                : "bg-red-500/10 text-red-500"
            )}
          >
            <span
              className={cn(
                "size-1.5 rounded-full",
                allCgPoints.every((p) => {
                  const inBounds =
                    p.cgPercentMac >= cgRange.min + 3 &&
                    p.cgPercentMac <= cgRange.max - 3;
                  return inBounds;
                })
                  ? "bg-green-500"
                  : "bg-red-500"
              )}
            />
            {allCgPoints.every((p) => {
              const inBounds =
                p.cgPercentMac >= cgRange.min + 3 &&
                p.cgPercentMac <= cgRange.max - 3;
              return inBounds;
            })
              ? "Within Envelope"
              : "CG Out of Limits"}
          </span>
        </div>
      )}
    </div>
  );
}

