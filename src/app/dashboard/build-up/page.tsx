"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Boxes,
  Plane,
  Package,
  Sparkles,
  RefreshCw,
  Loader2,
} from "lucide-react";
import {
  FlightSelector,
  FlightInfoBadge,
  useSelectedFlight,
} from "@/components/shared/flight-selector";
import {
  CargoList,
  OptimizationPanel,
  ResultsSummary,
  UldSelector,
  runOptimization,
  generateInstructions,
  getCargoItems,
  getPackingRules,
  getAvailableUldsForFlight,
  confirmBuildUpPlan,
  type OptimizationObjective,
  type AvailableUldDisplay,
  type RotationLevel,
} from "@/features/planning";
import type {
  OptimizationResult,
  BuildUpInstruction,
  PackingRule,
  OptimizerUsed,
} from "@/features/planning";
import type { CargoItemDisplay } from "@/features/cargo";

// ============================================================================
// BUILD-UP PAGE COMPONENT
// ============================================================================

export default function BuildUpPage() {
  const { selectedFlight } = useSelectedFlight();

  // Data state
  const [cargoItems, setCargoItems] = useState<CargoItemDisplay[]>([]);
  const [packingRules, setPackingRules] = useState<PackingRule[]>([]);
  const [availableUlds, setAvailableUlds] = useState<AvailableUldDisplay[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isLoadingUlds, setIsLoadingUlds] = useState(false);

  // UI state
  const [selectedCargoIds, setSelectedCargoIds] = useState<string[]>([]);
  const [selectedUldIds, setSelectedUldIds] = useState<string[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] =
    useState<OptimizationResult | null>(null);
  const [selectedUldIndex, setSelectedUldIndex] = useState(0);
  const [instructions, setInstructions] = useState<
    Map<number, BuildUpInstruction>
  >(new Map());
  const [isGeneratingInstructions, setIsGeneratingInstructions] =
    useState(false);
  const [activeTab, setActiveTab] = useState<"cargo" | "results">("cargo");
  const [objective, setObjective] =
    useState<OptimizationObjective>("MINIMIZE_ULDS");
  const [useLlm, setUseLlm] = useState(false);
  const [optimizerUsed, setOptimizerUsed] = useState<
    OptimizerUsed | undefined
  >();
  const [rotationLevel, setRotationLevel] = useState<RotationLevel>("Z_ONLY");
  const [loadPlanId, setLoadPlanId] = useState<string | undefined>();
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  // Fetch data when flight changes
  useEffect(() => {
    async function fetchData() {
      if (!selectedFlight?.id) {
        setCargoItems([]);
        setPackingRules([]);
        setAvailableUlds([]);
        return;
      }

      setIsLoadingData(true);
      setIsLoadingUlds(true);
      try {
        // Fetch data from database in parallel
        const [cargoResult, rulesResult, uldsResult] = await Promise.all([
          getCargoItems(selectedFlight.id),
          getPackingRules(),
          getAvailableUldsForFlight(selectedFlight.id),
        ]);

        setCargoItems(cargoResult.items);
        setPackingRules(rulesResult.rules);
        setAvailableUlds(uldsResult.ulds);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        setCargoItems([]);
        setPackingRules([]);
        setAvailableUlds([]);
      } finally {
        setIsLoadingData(false);
        setIsLoadingUlds(false);
      }
    }

    fetchData();
    // Reset selection when flight changes
    setSelectedCargoIds([]);
    setSelectedUldIds([]);
    setOptimizationResult(null);
    setInstructions(new Map());
    setActiveTab("cargo");
    setLoadPlanId(undefined);
    setIsConfirmed(false);
  }, [selectedFlight?.id]);

  // Calculate selected cargo weight and volume for capacity checks
  const selectedCargo = useMemo(() => {
    const items = cargoItems.filter((item) =>
      selectedCargoIds.includes(item.id)
    );
    return {
      items,
      weight: items.reduce((sum, item) => sum + item.weightKg, 0),
      volume: items.reduce(
        (sum, item) =>
          sum + (item.lengthCm * item.widthCm * item.heightCm) / 1000000, // cm³ to m³
        0
      ),
    };
  }, [cargoItems, selectedCargoIds]);

  const selectedWeight = selectedCargo.weight;

  // Handlers
  const handleOptimize = useCallback(
    async (selectedObjective: OptimizationObjective) => {
      if (selectedCargoIds.length === 0 || !selectedFlight?.id) return;

      setIsOptimizing(true);
      try {
        const result = await runOptimization({
          flightId: selectedFlight.id,
          cargoItemIds: selectedCargoIds,
          rules: packingRules,
          options: {
            objective: selectedObjective,
            rotationLevel,
            prioritizeHighPriorityCargo: true,
          },
          useLlm,
          selectedUldIds:
            selectedUldIds.length > 0 ? selectedUldIds : undefined,
        });

        if (result.success && result.result) {
          setOptimizationResult(result.result);
          setOptimizerUsed(result.optimizerUsed);
          setLoadPlanId(result.loadPlanId);
          setIsConfirmed(false);
          setActiveTab("results");
          setSelectedUldIndex(0);
          setInstructions(new Map());
        } else if (result.error) {
          console.error("Optimization error:", result.error);
        }
      } catch (error) {
        console.error("Optimization failed:", error);
      } finally {
        setIsOptimizing(false);
      }
    },
    [
      selectedCargoIds,
      selectedFlight?.id,
      packingRules,
      useLlm,
      rotationLevel,
      selectedUldIds,
    ]
  );

  const handleGenerateInstructions = useCallback(
    async (uldIndex: number) => {
      if (!optimizationResult) return;

      setIsGeneratingInstructions(true);
      try {
        const assignment = optimizationResult.assignments[uldIndex];
        const result = await generateInstructions({
          uldAssignmentId: `uld-${uldIndex}`,
          uldTypeCode: assignment.uldTypeCode,
          uldNumber: `${assignment.uldTypeCode}-${String(uldIndex + 1).padStart(
            5,
            "0"
          )}GA`,
          positionCode: assignment.positionCode,
          cargoItemIds: assignment.cargoItems.map((c) => c.cargoItemId),
          useLLM: false, // Set to true to use Claude LLM
        });

        if (result.success && result.instructions) {
          setInstructions((prev) =>
            new Map(prev).set(uldIndex, result.instructions!)
          );
        }
      } catch (error) {
        console.error("Instruction generation failed:", error);
      } finally {
        setIsGeneratingInstructions(false);
      }
    },
    [optimizationResult]
  );

  const handleConfirm = useCallback(async () => {
    if (!loadPlanId) return;

    setIsConfirming(true);
    try {
      const result = await confirmBuildUpPlan(loadPlanId);
      if (result.success) {
        setIsConfirmed(true);
      } else {
        console.error("Failed to confirm build-up:", result.error);
      }
    } catch (error) {
      console.error("Confirmation failed:", error);
    } finally {
      setIsConfirming(false);
    }
  }, [loadPlanId]);

  const handleReset = () => {
    setOptimizationResult(null);
    setOptimizerUsed(undefined);
    setInstructions(new Map());
    setActiveTab("cargo");
    setSelectedCargoIds([]);
    setSelectedUldIds([]);
    setLoadPlanId(undefined);
    setIsConfirmed(false);
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Boxes className="size-6 text-primary" />
            ULD Build-Up
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pack cargo into ULDs with AI-powered optimization
          </p>
        </div>

        <div className="flex items-center gap-3">
          {optimizationResult && (
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RefreshCw className="mr-2 size-4" />
              Reset
            </Button>
          )}
          <FlightSelector />
        </div>
      </div>

      {/* Flight info bar */}
      {selectedFlight && (
        <div className="mb-6">
          <FlightInfoBadge />
        </div>
      )}

      {/* Main content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left panel - Cargo or Results */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tab switcher */}
          <div className="flex items-center gap-1 p-1 rounded-sm bg-muted/30 w-fit">
            <button
              onClick={() => setActiveTab("cargo")}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-sm text-sm font-medium transition-colors",
                activeTab === "cargo"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Package className="size-4" />
              Cargo List
              {cargoItems.length > 0 && (
                <span className="ml-1 text-xs text-muted-foreground">
                  ({cargoItems.length})
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("results")}
              disabled={!optimizationResult}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-sm text-sm font-medium transition-colors",
                activeTab === "results"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
                !optimizationResult && "opacity-50 cursor-not-allowed"
              )}
            >
              <Sparkles className="size-4" />
              Results
              {optimizationResult && (
                <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                  {optimizationResult.stats.uldsUsed}
                </span>
              )}
            </button>
          </div>

          {/* Content */}
          {isLoadingData ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">
                  Loading cargo data...
                </span>
              </CardContent>
            </Card>
          ) : activeTab === "cargo" ? (
            <CargoList
              items={cargoItems}
              selectedIds={selectedCargoIds}
              onSelectionChange={setSelectedCargoIds}
            />
          ) : optimizationResult ? (
            <ResultsSummary
              result={optimizationResult}
              selectedUldIndex={selectedUldIndex}
              onSelectUld={setSelectedUldIndex}
              onGenerateInstructions={handleGenerateInstructions}
              instructions={instructions}
              isGeneratingInstructions={isGeneratingInstructions}
              cargoItems={cargoItems}
              loadPlanId={loadPlanId}
              isConfirmed={isConfirmed}
              onConfirm={handleConfirm}
              isConfirming={isConfirming}
            />
          ) : null}
        </div>

        {/* Right panel - Optimization controls */}
        <div className="space-y-4">
          <OptimizationPanel
            selectedCargoCount={selectedCargoIds.length}
            selectedWeight={selectedWeight}
            onOptimize={handleOptimize}
            isOptimizing={isOptimizing}
            result={optimizationResult}
            rules={packingRules}
            objective={objective}
            onObjectiveChange={setObjective}
            useLlm={useLlm}
            onUseLlmChange={setUseLlm}
            optimizerUsed={optimizerUsed}
            rotationLevel={rotationLevel}
            onRotationLevelChange={setRotationLevel}
          />

          {/* ULD Selection */}
          <UldSelector
            availableUlds={availableUlds}
            selectedUldIds={selectedUldIds}
            onSelectionChange={setSelectedUldIds}
            isLoading={isLoadingUlds}
            disabled={isOptimizing}
            requiredWeightKg={selectedCargo.weight}
            requiredVolumeM3={selectedCargo.volume}
          />
        </div>
      </div>

      {/* Empty state for no flight selected */}
      {!selectedFlight && (
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
                Choose a flight to start planning the ULD build-up for cargo
                loading.
              </p>
              <FlightSelector className="w-full" />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
