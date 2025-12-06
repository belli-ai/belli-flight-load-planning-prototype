"use client";

import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import {
  Scale,
  Plane,
  RefreshCw,
  Loader2,
  Download,
  Sparkles,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Weight,
  Target,
  Boxes,
} from "lucide-react";
import {
  FlightSelector,
  FlightInfoBadge,
  useSelectedFlight,
} from "@/components/shared/flight-selector";
import {
  AircraftViewer3D,
  CgEnvelopeChart,
  UldPositionList,
  WeightBreakdown,
  getLoadPlanWithAssignments,
  getLoadPlansForFlight,
  optimizeBalance,
  generateLoadSheetPdf,
  downloadLoadSheet,
  type LoadPlanWithAssignments,
  type BalanceOptimizationResult,
} from "@/features/weight-balance";
import type { UldAssignmentResult } from "@/features/planning";

// ============================================================================
// COLLAPSIBLE WEIGHT SUMMARY COMPONENT
// ============================================================================

function CollapsibleWeightSummary({
  loadPlan,
  defaultOpen = true,
}: {
  loadPlan: LoadPlanWithAssignments;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const weights = [
    {
      label: "Operating Empty Weight",
      value: loadPlan.aircraft.operatingEmptyWeightKg,
      limit: null,
    },
    {
      label: "Payload",
      value: loadPlan.weights.payloadKg,
      limit: loadPlan.aircraft.totalMaxPayloadKg,
    },
    {
      label: "Zero Fuel Weight",
      value: loadPlan.weights.zeroFuelWeightKg,
      limit: loadPlan.aircraft.maxZeroFuelWeightKg,
      highlight: true,
    },
    {
      label: "Takeoff Weight",
      value: loadPlan.weights.takeoffWeightKg,
      limit: loadPlan.aircraft.maxTakeoffWeightKg,
      highlight: true,
    },
    {
      label: "Landing Weight",
      value: loadPlan.weights.landingWeightKg,
      limit: loadPlan.aircraft.maxLandingWeightKg,
      highlight: true,
    },
  ];

  const hasExceeded = weights.some((w) => w.limit && w.value > w.limit);

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-2 cursor-pointer hover:bg-muted/30 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Weight className="size-4 text-primary" />
                Weight Summary
                {hasExceeded && (
                  <AlertTriangle className="size-3.5 text-red-500" />
                )}
              </CardTitle>
              <ChevronDown
                className={cn(
                  "size-4 text-muted-foreground transition-transform",
                  isOpen && "rotate-180"
                )}
              />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 pb-3">
            <div className="space-y-2">
              {weights.map((w) => {
                const utilization = w.limit ? (w.value / w.limit) * 100 : 0;
                const isOverLimit = w.limit && w.value > w.limit;

                return (
                  <div
                    key={w.label}
                    className={cn(
                      "flex items-center justify-between py-1.5",
                      w.highlight && "border-t border-border pt-2"
                    )}
                  >
                    <span
                      className={cn(
                        "text-xs",
                        w.highlight ? "font-medium" : "text-muted-foreground"
                      )}
                    >
                      {w.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "text-xs font-medium tabular-nums",
                          isOverLimit && "text-red-500"
                        )}
                      >
                        {(w.value / 1000).toFixed(1)}t
                      </span>
                      {w.limit && (
                        <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              isOverLimit
                                ? "bg-red-500"
                                : utilization > 95
                                ? "bg-yellow-500"
                                : "bg-primary"
                            )}
                            style={{ width: `${Math.min(utilization, 100)}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Limits reference */}
            <div className="mt-3 pt-3 border-t border-border">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
                <div className="flex justify-between">
                  <span>MZFW:</span>
                  <span className="tabular-nums">
                    {(loadPlan.aircraft.maxZeroFuelWeightKg / 1000).toFixed(1)}t
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>MTOW:</span>
                  <span className="tabular-nums">
                    {(loadPlan.aircraft.maxTakeoffWeightKg / 1000).toFixed(1)}t
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>MLW:</span>
                  <span className="tabular-nums">
                    {(loadPlan.aircraft.maxLandingWeightKg / 1000).toFixed(1)}t
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Max Payload:</span>
                  <span className="tabular-nums">
                    {(loadPlan.aircraft.totalMaxPayloadKg / 1000).toFixed(1)}t
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

// ============================================================================
// COLLAPSIBLE CG DATA COMPONENT
// ============================================================================

function CollapsibleCgData({
  cgResult,
  defaultOpen = true,
}: {
  cgResult?: {
    zeroFuelWeightKg: number;
    zfwCgPercentMac: number;
    zfwWithinEnvelope: boolean;
    payloadWeightKg: number;
    totalMomentKgCm: number;
    forwardLimitPercentMac: number;
    aftLimitPercentMac: number;
  } | null;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const hasCgData = !!cgResult;

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-2 cursor-pointer hover:bg-muted/30 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="size-4 text-primary" />
                CG Data
                {cgResult &&
                  (cgResult.zfwWithinEnvelope ? (
                    <CheckCircle2 className="size-3.5 text-green-500" />
                  ) : (
                    <AlertTriangle className="size-3.5 text-red-500" />
                  ))}
              </CardTitle>
              <ChevronDown
                className={cn(
                  "size-4 text-muted-foreground transition-transform",
                  isOpen && "rotate-180"
                )}
              />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 pb-3">
            {hasCgData ? (
              <div className="space-y-3">
                {/* CG Position */}
                <div className="p-3 rounded-sm bg-muted/30">
                  <div className="text-center">
                    <div
                      className={cn(
                        "text-2xl font-bold tabular-nums",
                        cgResult.zfwWithinEnvelope
                          ? "text-green-500"
                          : "text-red-500"
                      )}
                    >
                      {cgResult.zfwCgPercentMac.toFixed(1)}%
                    </div>
                    <div className="text-[10px] uppercase text-muted-foreground mt-1">
                      ZFW CG (% MAC)
                    </div>
                  </div>

                  {/* CG Bar indicator */}
                  <div className="mt-3 px-2">
                    <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                      {/* Envelope range */}
                      <div
                        className="absolute h-full bg-green-500/30"
                        style={{
                          left: `${
                            ((cgResult.forwardLimitPercentMac - 10) / 40) * 100
                          }%`,
                          right: `${
                            100 -
                            ((cgResult.aftLimitPercentMac - 10) / 40) * 100
                          }%`,
                        }}
                      />
                      {/* Current CG position */}
                      <div
                        className={cn(
                          "absolute w-1 h-full -translate-x-1/2",
                          cgResult.zfwWithinEnvelope
                            ? "bg-green-500"
                            : "bg-red-500"
                        )}
                        style={{
                          left: `${
                            ((cgResult.zfwCgPercentMac - 10) / 40) * 100
                          }%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between mt-1 text-[9px] text-muted-foreground">
                      <span>
                        FWD ({cgResult.forwardLimitPercentMac.toFixed(0)}%)
                      </span>
                      <span>
                        AFT ({cgResult.aftLimitPercentMac.toFixed(0)}%)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center justify-center gap-2 py-2">
                  {cgResult.zfwWithinEnvelope ? (
                    <>
                      <CheckCircle2 className="size-4 text-green-500" />
                      <span className="text-sm text-green-500 font-medium">
                        Within Envelope
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="size-4 text-red-500" />
                      <span className="text-sm text-red-500 font-medium">
                        Out of Limits
                      </span>
                    </>
                  )}
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-sm bg-muted/20 text-center">
                    <div className="font-medium tabular-nums">
                      {(cgResult.zeroFuelWeightKg / 1000).toFixed(1)}t
                    </div>
                    <div className="text-[10px] text-muted-foreground">ZFW</div>
                  </div>
                  <div className="p-2 rounded-sm bg-muted/20 text-center">
                    <div className="font-medium tabular-nums">
                      {(cgResult.totalMomentKgCm / 1000000).toFixed(2)}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      Moment (×10⁶)
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <Target className="size-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">Run optimization to calculate CG</p>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

// ============================================================================
// LOAD BALANCING PAGE COMPONENT
// ============================================================================

export default function LoadBalancingPage() {
  const { selectedFlight, setFlightById } = useSelectedFlight();
  const searchParams = useSearchParams();
  const loadPlanIdParam = searchParams.get("loadPlanId");

  // Data state
  const [loadPlan, setLoadPlan] = useState<LoadPlanWithAssignments | null>(
    null
  );
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fromBuildUp, setFromBuildUp] = useState(false);

  // Optimization state
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] =
    useState<BalanceOptimizationResult | null>(null);

  // UI state
  const [selectedUldIndex, setSelectedUldIndex] = useState<number | undefined>(
    undefined
  );
  const [isExporting, setIsExporting] = useState(false);

  // Fetch load plan by ID (from URL param) or by flight
  useEffect(() => {
    async function fetchLoadPlan() {
      // If we have a loadPlanId from URL, use it directly
      if (loadPlanIdParam) {
        setIsLoadingData(true);
        setError(null);
        setFromBuildUp(true);

        try {
          const loadPlanResult = await getLoadPlanWithAssignments(
            loadPlanIdParam
          );

          if (!loadPlanResult.success || !loadPlanResult.data) {
            setError(loadPlanResult.error || "Failed to load plan data");
            setLoadPlan(null);
            return;
          }

          setLoadPlan(loadPlanResult.data);

          // Set the flight context using the flightId from the load plan
          if (loadPlanResult.data.flightId) {
            setFlightById(loadPlanResult.data.flightId);
          }
        } catch (err) {
          console.error("Failed to fetch load plan by ID:", err);
          setError("Failed to load data");
          setLoadPlan(null);
        } finally {
          setIsLoadingData(false);
        }
        return;
      }

      // Otherwise, fetch by selected flight
      if (!selectedFlight?.id) {
        setLoadPlan(null);
        setOptimizationResult(null);
        setFromBuildUp(false);
        return;
      }

      setIsLoadingData(true);
      setError(null);
      setFromBuildUp(false);

      try {
        // First, get load plans for this flight
        const plansResult = await getLoadPlansForFlight(selectedFlight.id);

        if (!plansResult.success || plansResult.plans.length === 0) {
          setError(
            "No load plan found for this flight. Please run optimization from the Build-Up page first."
          );
          setLoadPlan(null);
          return;
        }

        // Get the most recent load plan
        const latestPlanId = plansResult.plans[0].id;
        const loadPlanResult = await getLoadPlanWithAssignments(latestPlanId);

        if (!loadPlanResult.success || !loadPlanResult.data) {
          setError(loadPlanResult.error || "Failed to load plan data");
          setLoadPlan(null);
          return;
        }

        setLoadPlan(loadPlanResult.data);
      } catch (err) {
        console.error("Failed to fetch load plan:", err);
        setError("Failed to load data");
        setLoadPlan(null);
      } finally {
        setIsLoadingData(false);
      }
    }

    fetchLoadPlan();
    setSelectedUldIndex(undefined);
    setOptimizationResult(null);
  }, [selectedFlight?.id, loadPlanIdParam, setFlightById]);

  // Convert load plan assignments to visualization format
  const assignments: UldAssignmentResult[] =
    loadPlan?.assignments.map((a) => ({
      uldId: null,
      uldNumber: a.uldNumber,
      uldTypeId: a.uldTypeId,
      uldTypeCode: a.uldTypeCode,
      positionCode: a.positionCode,
      cargoItems: [],
      totalWeightKg: a.totalWeightKg,
      volumeUsedM3: 0,
      volumeUtilization: a.volumeUtilization,
      weightUtilization: 0,
      uldDimensions: { lengthCm: 150, widthCm: 150, heightCm: 150 },
      maxGrossWeightKg: 1500,
    })) ?? [];

  // Use optimized assignments if available
  const displayAssignments = optimizationResult?.assignments ?? assignments;

  // Handle balance optimization
  const handleOptimize = useCallback(async () => {
    if (!loadPlan) return;

    setIsOptimizing(true);
    try {
      const result = await optimizeBalance({
        loadPlanId: loadPlan.id,
        strategy: "CG_OPTIMIZED",
        targetCgPercentMac: 28, // Target 28% MAC
      });

      setOptimizationResult(result);
    } catch (err) {
      console.error("Optimization failed:", err);
    } finally {
      setIsOptimizing(false);
    }
  }, [loadPlan]);

  // Handle export
  const handleExport = useCallback(async () => {
    if (!loadPlan || !selectedFlight) return;

    setIsExporting(true);
    try {
      const blob = await generateLoadSheetPdf({
        flightNumber: selectedFlight.flightNumber,
        date: new Date(selectedFlight.scheduledDeparture).toLocaleDateString(),
        aircraftType: loadPlan.aircraft.typeCode,
        aircraftRegistration: loadPlan.aircraft.name,
        origin: selectedFlight.originCode,
        destination: selectedFlight.destinationCode,
        weights: {
          operatingEmptyWeightKg: loadPlan.aircraft.operatingEmptyWeightKg,
          payloadKg: loadPlan.weights.payloadKg,
          zeroFuelWeightKg: loadPlan.weights.zeroFuelWeightKg,
          takeoffWeightKg: loadPlan.weights.takeoffWeightKg,
          landingWeightKg: loadPlan.weights.landingWeightKg,
        },
        limits: {
          maxZeroFuelWeightKg: loadPlan.aircraft.maxZeroFuelWeightKg,
          maxTakeoffWeightKg: loadPlan.aircraft.maxTakeoffWeightKg,
          maxLandingWeightKg: loadPlan.aircraft.maxLandingWeightKg,
          maxPayloadKg: loadPlan.aircraft.totalMaxPayloadKg,
        },
        cgData: {
          zfwCg: optimizationResult?.cgResult
            ? {
                cgPercentMac: optimizationResult.cgResult.zfwCgPercentMac,
                isWithinEnvelope: optimizationResult.cgResult.zfwWithinEnvelope,
              }
            : undefined,
        },
        stabilizerTrim: 5.2, // Example value
        assignments: displayAssignments,
      });

      downloadLoadSheet(
        blob,
        `LoadSheet_${selectedFlight.flightNumber}_${
          new Date().toISOString().split("T")[0]
        }.pdf`
      );
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setIsExporting(false);
    }
  }, [loadPlan, selectedFlight, displayAssignments, optimizationResult]);

  // Handle reset
  const handleReset = () => {
    setOptimizationResult(null);
    setSelectedUldIndex(undefined);
  };

  // CG points for chart
  const cgPoints = optimizationResult?.cgResult
    ? [
        {
          type: "ZFW" as const,
          weightKg: optimizationResult.cgResult.zeroFuelWeightKg,
          cgPercentMac: optimizationResult.cgResult.zfwCgPercentMac,
          label: "Zero Fuel Weight",
          color: "#22c55e",
        },
      ]
    : loadPlan
    ? [
        {
          type: "ZFW" as const,
          weightKg: loadPlan.weights.zeroFuelWeightKg,
          cgPercentMac: 28, // Default estimate
          label: "Zero Fuel Weight",
          color: "#22c55e",
        },
      ]
    : [];

  return (
    <div className="mx-auto max-w-7xl px-6 py-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Scale className="size-6 text-primary" />
            Load Balancing
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Weight distribution, CG calculations, and position optimization
          </p>
        </div>

        <div className="flex items-center gap-3">
          {optimizationResult && (
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RefreshCw className="mr-2 size-4" />
              Reset
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={!loadPlan || isExporting}
          >
            {isExporting ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Download className="mr-2 size-4" />
            )}
            Export Load Sheet
          </Button>
          <FlightSelector />
        </div>
      </div>

      {/* Flight info bar */}
      {selectedFlight && (
        <div className="mb-6">
          <FlightInfoBadge />
        </div>
      )}

      {/* Build-up confirmation banner */}
      {fromBuildUp && loadPlan && (
        <div className="mb-6 rounded-sm border border-green-500/30 bg-green-500/5 p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-green-500/10">
              <Boxes className="size-4 text-green-500" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-green-400">
                  Build-Up Plan Confirmed
                </span>
                <Badge variant="secondary" className="text-[10px]">
                  {loadPlan.assignments.length} ULDs
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                This load plan was created from the ULD Build-Up page. You can
                now optimize position assignments.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoadingData && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">
              Loading load plan data...
            </span>
          </CardContent>
        </Card>
      )}

      {/* Error state */}
      {error && !isLoadingData && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <AlertTriangle className="size-10 text-yellow-500 mb-3" />
            <p className="text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Main content */}
      {loadPlan && !isLoadingData && !error && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left panel - ULD List & Data */}
          <div className="space-y-4">
            <UldPositionList
              assignments={displayAssignments}
              selectedIndex={selectedUldIndex}
              onSelect={setSelectedUldIndex}
            />

            {/* Weight Summary - Collapsible */}
            <CollapsibleWeightSummary loadPlan={loadPlan} defaultOpen={true} />

            {/* CG Data - Collapsible */}
            <CollapsibleCgData
              cgResult={optimizationResult?.cgResult}
              defaultOpen={true}
            />

            {/* Optimization button */}
            <Card>
              <CardContent className="pt-4">
                <Button
                  className="w-full"
                  onClick={handleOptimize}
                  disabled={isOptimizing}
                >
                  {isOptimizing ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Optimizing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 size-4" />
                      Optimize Balance
                    </>
                  )}
                </Button>
                <p className="mt-2 text-xs text-center text-muted-foreground">
                  Optimize ULD positions for ideal CG
                </p>

                {/* Warnings */}
                {optimizationResult &&
                  optimizationResult.warnings.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border text-center">
                      <span className="text-xs text-yellow-500">
                        {optimizationResult.warnings.length} warning(s)
                      </span>
                    </div>
                  )}
              </CardContent>
            </Card>
          </div>

          {/* Center/Right panel - Visualization & Data */}
          <div className="lg:col-span-2 space-y-4">
            {/* Aircraft 3D Visualization */}
            <Card>
              <CardContent className="pt-4">
                <AircraftViewer3D
                  assignments={displayAssignments}
                  selectedUldIndex={selectedUldIndex}
                  onUldSelect={setSelectedUldIndex}
                />
              </CardContent>
            </Card>

            {/* Weight & CG Data below visualization */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Weight Breakdown */}
              <WeightBreakdown
                weights={{
                  operatingEmptyWeightKg:
                    loadPlan.aircraft.operatingEmptyWeightKg,
                  payloadKg: loadPlan.weights.payloadKg,
                  zeroFuelWeightKg: loadPlan.weights.zeroFuelWeightKg,
                  takeoffWeightKg: loadPlan.weights.takeoffWeightKg,
                  landingWeightKg: loadPlan.weights.landingWeightKg,
                }}
                limits={{
                  maxZeroFuelWeightKg: loadPlan.aircraft.maxZeroFuelWeightKg,
                  maxTakeoffWeightKg: loadPlan.aircraft.maxTakeoffWeightKg,
                  maxLandingWeightKg: loadPlan.aircraft.maxLandingWeightKg,
                  maxPayloadKg: loadPlan.aircraft.totalMaxPayloadKg,
                }}
                compact
              />

              {/* CG Envelope Chart */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <BarChart3 className="size-4 text-primary" />
                    CG Envelope
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CgEnvelopeChart cgPoints={cgPoints} compact showLegend />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Empty state for no flight selected */}
      {!selectedFlight && !isLoadingData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plane className="size-5 text-primary" />
                Select a Flight
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Choose a flight to view and optimize load balancing.
              </p>
              <FlightSelector className="w-full" />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
