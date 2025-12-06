"use client";

import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
// LOAD BALANCING PAGE COMPONENT
// ============================================================================

export default function LoadBalancingPage() {
  const { selectedFlight } = useSelectedFlight();

  // Data state
  const [loadPlan, setLoadPlan] = useState<LoadPlanWithAssignments | null>(
    null
  );
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Optimization state
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] =
    useState<BalanceOptimizationResult | null>(null);

  // UI state
  const [selectedUldIndex, setSelectedUldIndex] = useState<number | undefined>(
    undefined
  );
  const [activeTab, setActiveTab] = useState<"visualization" | "data">(
    "visualization"
  );
  const [isExporting, setIsExporting] = useState(false);

  // Fetch load plan when flight changes
  useEffect(() => {
    async function fetchLoadPlan() {
      if (!selectedFlight?.id) {
        setLoadPlan(null);
        setOptimizationResult(null);
        return;
      }

      setIsLoadingData(true);
      setError(null);

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
  }, [selectedFlight?.id]);

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
          {/* Left panel - ULD List */}
          <div className="space-y-4">
            <UldPositionList
              assignments={displayAssignments}
              selectedIndex={selectedUldIndex}
              onSelect={setSelectedUldIndex}
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

                {/* Optimization status */}
                {optimizationResult && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex items-center justify-center gap-2">
                      {optimizationResult.cgResult?.zfwWithinEnvelope ? (
                        <>
                          <CheckCircle2 className="size-4 text-green-500" />
                          <span className="text-sm text-green-500">
                            CG Within Envelope
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="size-4 text-yellow-500" />
                          <span className="text-sm text-yellow-500">
                            Check CG Limits
                          </span>
                        </>
                      )}
                    </div>
                    {optimizationResult.warnings.length > 0 && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        {optimizationResult.warnings.length} warning(s)
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Center/Right panel - Visualization & Data */}
          <div className="lg:col-span-2 space-y-4">
            {/* Tab switcher */}
            <div className="flex items-center gap-1 p-1 rounded-sm bg-muted/30 w-fit">
              <button
                onClick={() => setActiveTab("visualization")}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-sm text-sm font-medium transition-colors",
                  activeTab === "visualization"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Plane className="size-4" />
                Aircraft View
              </button>
              <button
                onClick={() => setActiveTab("data")}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-sm text-sm font-medium transition-colors",
                  activeTab === "data"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <BarChart3 className="size-4" />
                Weight & CG Data
              </button>
            </div>

            {/* Visualization tab */}
            {activeTab === "visualization" && (
              <Card>
                <CardContent className="pt-4">
                  <AircraftViewer3D
                    assignments={displayAssignments}
                    selectedUldIndex={selectedUldIndex}
                    onUldSelect={setSelectedUldIndex}
                  />
                </CardContent>
              </Card>
            )}

            {/* Data tab */}
            {activeTab === "data" && (
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

                {/* CG Result Summary */}
                {optimizationResult?.cgResult && (
                  <Card className="md:col-span-2">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">
                        CG Calculation Result
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div className="p-3 rounded-sm bg-muted/30">
                          <div className="text-lg font-semibold">
                            {optimizationResult.cgResult.zfwCgPercentMac.toFixed(
                              1
                            )}
                            %
                          </div>
                          <div className="text-xs text-muted-foreground">
                            ZFW CG (% MAC)
                          </div>
                        </div>
                        <div className="p-3 rounded-sm bg-muted/30">
                          <div className="text-lg font-semibold">
                            {optimizationResult.cgResult.zeroFuelWeightKg.toLocaleString()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            ZFW (kg)
                          </div>
                        </div>
                        <div className="p-3 rounded-sm bg-muted/30">
                          <div className="text-lg font-semibold">
                            {optimizationResult.cgResult.forwardLimitPercentMac.toFixed(
                              1
                            )}
                            %
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Forward Limit
                          </div>
                        </div>
                        <div className="p-3 rounded-sm bg-muted/30">
                          <div className="text-lg font-semibold">
                            {optimizationResult.cgResult.aftLimitPercentMac.toFixed(
                              1
                            )}
                            %
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Aft Limit
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
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
