"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Scale,
  Plane,
  Fuel,
  Package,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import type { WeightBreakdown as WeightBreakdownType } from "../types";

// ============================================================================
// TYPES
// ============================================================================

type WeightBreakdownProps = {
  weights: Partial<WeightBreakdownType>;
  limits: {
    maxZeroFuelWeightKg: number;
    maxTakeoffWeightKg: number;
    maxLandingWeightKg: number;
    maxPayloadKg: number;
  };
  className?: string;
  compact?: boolean;
};

type WeightRowProps = {
  label: string;
  value: number | undefined;
  limit?: number;
  icon?: React.ReactNode;
  isTotal?: boolean;
  showWarning?: boolean;
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatWeight(kg: number | undefined): string {
  if (kg === undefined) return "—";
  return kg.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function getUtilization(value: number, limit: number): number {
  if (limit <= 0) return 0;
  return (value / limit) * 100;
}

function getUtilizationColor(utilization: number): string {
  if (utilization > 100) return "text-red-500";
  if (utilization > 95) return "text-yellow-500";
  return "text-green-500";
}

function getProgressColor(utilization: number): string {
  if (utilization > 100) return "bg-red-500";
  if (utilization > 95) return "bg-yellow-500";
  return "bg-primary";
}

// ============================================================================
// WEIGHT ROW COMPONENT
// ============================================================================

function WeightRow({
  label,
  value,
  limit,
  icon,
  isTotal = false,
  showWarning = false,
}: WeightRowProps) {
  const utilization = limit && value ? getUtilization(value, limit) : 0;
  const isOverLimit = utilization > 100;

  return (
    <div
      className={cn(
        "flex items-center justify-between py-2",
        isTotal && "border-t border-border pt-3 mt-2"
      )}
    >
      <div className="flex items-center gap-2">
        {icon && (
          <span className={cn("text-muted-foreground", isTotal && "text-primary")}>
            {icon}
          </span>
        )}
        <span
          className={cn(
            "text-sm",
            isTotal ? "font-semibold" : "text-muted-foreground"
          )}
        >
          {label}
        </span>
        {showWarning && isOverLimit && (
          <AlertTriangle className="size-3.5 text-red-500" />
        )}
      </div>
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "text-sm font-medium tabular-nums",
            isOverLimit && "text-red-500"
          )}
        >
          {formatWeight(value)} kg
        </span>
        {limit && value !== undefined && (
          <div className="flex items-center gap-2 min-w-[100px]">
            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  getProgressColor(utilization)
                )}
                style={{ width: `${Math.min(utilization, 100)}%` }}
              />
            </div>
            <span
              className={cn(
                "text-xs tabular-nums",
                getUtilizationColor(utilization)
              )}
            >
              {utilization.toFixed(0)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function WeightBreakdown({
  weights,
  limits,
  className,
  compact = false,
}: WeightBreakdownProps) {
  // Calculate derived values
  const oewDisplay = weights.operatingEmptyWeightKg ?? 48000; // Default A321 OEW
  const dowDisplay = weights.dryOperatingWeightKg ?? oewDisplay;
  const payloadDisplay = weights.payloadKg ?? 0;
  const zfwDisplay = weights.zeroFuelWeightKg ?? dowDisplay + payloadDisplay;
  const fuelDisplay = weights.takeoffFuelKg ?? 0;
  const towDisplay = weights.takeoffWeightKg ?? zfwDisplay + fuelDisplay;
  const tripFuelDisplay = weights.tripFuelKg ?? 0;
  const ldwDisplay = weights.landingWeightKg ?? towDisplay - tripFuelDisplay;

  // Check if within limits
  const zfwWithinLimits = zfwDisplay <= limits.maxZeroFuelWeightKg;
  const towWithinLimits = towDisplay <= limits.maxTakeoffWeightKg;
  const ldwWithinLimits = ldwDisplay <= limits.maxLandingWeightKg;
  const payloadWithinLimits = payloadDisplay <= limits.maxPayloadKg;
  const allWithinLimits =
    zfwWithinLimits && towWithinLimits && ldwWithinLimits && payloadWithinLimits;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Scale className="size-4 text-primary" />
            Weight Summary
          </CardTitle>
          {allWithinLimits ? (
            <span className="flex items-center gap-1 text-xs text-green-500">
              <CheckCircle2 className="size-3.5" />
              Within Limits
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-red-500">
              <AlertTriangle className="size-3.5" />
              Limit Exceeded
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        {!compact && (
          <>
            <WeightRow
              label="Operating Empty Weight"
              value={oewDisplay}
              icon={<Plane className="size-3.5" />}
            />
            <WeightRow
              label="Dry Operating Weight"
              value={dowDisplay}
              icon={<Plane className="size-3.5" />}
            />
          </>
        )}
        
        <WeightRow
          label="Payload"
          value={payloadDisplay}
          limit={limits.maxPayloadKg}
          icon={<Package className="size-3.5" />}
          showWarning
        />

        <WeightRow
          label="Zero Fuel Weight"
          value={zfwDisplay}
          limit={limits.maxZeroFuelWeightKg}
          isTotal
          showWarning
        />

        {!compact && (
          <WeightRow
            label="Takeoff Fuel"
            value={fuelDisplay}
            icon={<Fuel className="size-3.5" />}
          />
        )}

        <WeightRow
          label="Takeoff Weight"
          value={towDisplay}
          limit={limits.maxTakeoffWeightKg}
          isTotal
          showWarning
        />

        {!compact && (
          <WeightRow
            label="Trip Fuel"
            value={tripFuelDisplay}
            icon={<Fuel className="size-3.5" />}
          />
        )}

        <WeightRow
          label="Landing Weight"
          value={ldwDisplay}
          limit={limits.maxLandingWeightKg}
          isTotal
          showWarning
        />

        {/* Limit reference */}
        {!compact && (
          <div className="mt-4 pt-3 border-t border-border">
            <div className="text-xs text-muted-foreground mb-2">Aircraft Limits</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">MZFW:</span>
                <span className="tabular-nums">
                  {formatWeight(limits.maxZeroFuelWeightKg)} kg
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">MTOW:</span>
                <span className="tabular-nums">
                  {formatWeight(limits.maxTakeoffWeightKg)} kg
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">MLW:</span>
                <span className="tabular-nums">
                  {formatWeight(limits.maxLandingWeightKg)} kg
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Max Payload:</span>
                <span className="tabular-nums">
                  {formatWeight(limits.maxPayloadKg)} kg
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

