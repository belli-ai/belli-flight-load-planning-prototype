"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Scale,
  Plane,
  RefreshCw,
  Loader2,
  Download,
  Sparkles,
  BarChart3,
  AlertTriangle,
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
// LOAD BALANCING PAGE COMPONENT
// ============================================================================

function LoadBalancingPageContent() {
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
                  deckConfig={loadPlan.deckConfig}
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

export default function LoadBalancingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <LoadBalancingPageContent />
    </Suspense>
  );
}
