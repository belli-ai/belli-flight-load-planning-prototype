"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  Play,
  Loader2,
  Check,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Zap,
  Target,
  Scale,
} from "lucide-react";
import type { OptimizationResult, PackingRule } from "../types";

// ============================================================================
// TYPES
// ============================================================================

export type OptimizationObjective = "MINIMIZE_ULDS" | "MAXIMIZE_UTILIZATION" | "BALANCED";

type Objective = OptimizationObjective; // Internal alias

type OptimizationPanelProps = {
  selectedCargoCount: number;
  selectedWeight: number;
  onOptimize: (objective: Objective) => Promise<void>;
  isOptimizing: boolean;
  result: OptimizationResult | null;
  rules?: PackingRule[];
  objective?: Objective;
  onObjectiveChange?: (objective: Objective) => void;
};

// ============================================================================
// COMPONENT
// ============================================================================

export function OptimizationPanel({
  selectedCargoCount,
  selectedWeight,
  onOptimize,
  isOptimizing,
  result,
  rules = [],
  objective: controlledObjective,
  onObjectiveChange,
}: OptimizationPanelProps) {
  // Support both controlled and uncontrolled objective state
  const [internalObjective, setInternalObjective] = useState<Objective>("MINIMIZE_ULDS");
  const objective = controlledObjective ?? internalObjective;
  
  const handleObjectiveChange = (newObjective: Objective) => {
    if (onObjectiveChange) {
      onObjectiveChange(newObjective);
    } else {
      setInternalObjective(newObjective);
    }
  };
  
  const [showRules, setShowRules] = useState(false);
  const [activeRuleIds, setActiveRuleIds] = useState<Set<string>>(new Set());

  // Update active rules when rules prop changes - all rules active by default
  useEffect(() => {
    setActiveRuleIds(new Set(rules.map((r) => r.id)));
  }, [rules]);

  const toggleRule = (ruleId: string) => {
    setActiveRuleIds((prev) => {
      const next = new Set(prev);
      if (next.has(ruleId)) {
        next.delete(ruleId);
      } else {
        next.add(ruleId);
      }
      return next;
    });
  };

  const objectives: { id: Objective; label: string; icon: React.ReactNode; description: string }[] = [
    {
      id: "MINIMIZE_ULDS",
      label: "Min ULDs",
      icon: <Target className="size-4" />,
      description: "Use fewest containers",
    },
    {
      id: "MAXIMIZE_UTILIZATION",
      label: "Max Fill",
      icon: <Zap className="size-4" />,
      description: "Maximize space usage",
    },
    {
      id: "BALANCED",
      label: "Balanced",
      icon: <Scale className="size-4" />,
      description: "Balance weight & space",
    },
  ];

  const getRuleTypeColor = (type: string) => {
    switch (type) {
      case "CONSTRAINT":
        return "bg-blue-500/20 text-blue-400";
      case "PROHIBITION":
        return "bg-red-500/20 text-red-400";
      case "PREFERENCE":
        return "bg-amber-500/20 text-amber-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const canOptimize = selectedCargoCount > 0 && !isOptimizing;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="size-4 text-primary" />
          Optimization
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Selection summary */}
        <div className="rounded-sm border border-border bg-background/50 p-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Selected cargo:</span>
            <span className="font-medium">{selectedCargoCount} items</span>
          </div>
          <div className="mt-1 flex justify-between text-sm">
            <span className="text-muted-foreground">Total weight:</span>
            <span className="font-medium">{selectedWeight.toLocaleString()} kg</span>
          </div>
        </div>

        {/* Objective selection */}
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Optimization Goal
          </label>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {objectives.map((obj) => (
              <button
                key={obj.id}
                onClick={() => handleObjectiveChange(obj.id)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-sm border p-2 transition-colors",
                  objective === obj.id
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-muted-foreground"
                )}
              >
                <span className={cn(objective === obj.id ? "text-primary" : "text-muted-foreground")}>
                  {obj.icon}
                </span>
                <span className="text-xs font-medium">{obj.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Rules section */}
        <div>
          <button
            onClick={() => setShowRules(!showRules)}
            className="flex w-full items-center justify-between text-xs font-medium text-muted-foreground uppercase tracking-wide hover:text-foreground"
          >
            <span>Packing Rules ({activeRuleIds.size} active)</span>
            {showRules ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>

          {showRules && (
            <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
              {rules.map((rule) => (
                <label
                  key={rule.id}
                  className={cn(
                    "flex items-start gap-2 rounded-sm border p-2 cursor-pointer transition-colors",
                    activeRuleIds.has(rule.id)
                      ? "border-border bg-background"
                      : "border-transparent bg-muted/30 opacity-60"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={activeRuleIds.has(rule.id)}
                    onChange={() => toggleRule(rule.id)}
                    className="mt-0.5 rounded border-border"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex rounded-sm px-1 py-0.5 text-[9px] font-medium uppercase",
                          getRuleTypeColor(rule.ruleType)
                        )}
                      >
                        {rule.ruleType}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        Priority: {rule.priority}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-tight">{rule.ruleText}</p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Optimize button */}
        <Button
          onClick={() => onOptimize(objective)}
          disabled={!canOptimize}
          className="w-full h-10 text-sm font-medium"
        >
          {isOptimizing ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Optimizing...
            </>
          ) : result ? (
            <>
              <Check className="mr-2 size-4" />
              Re-optimize
            </>
          ) : (
            <>
              <Play className="mr-2 size-4" />
              Run Optimization
            </>
          )}
        </Button>

        {/* Result preview */}
        {result && (
          <div
            className={cn(
              "rounded-sm border p-3",
              result.status === "OPTIMAL"
                ? "border-green-500/30 bg-green-500/5"
                : result.status === "FEASIBLE"
                ? "border-amber-500/30 bg-amber-500/5"
                : "border-red-500/30 bg-red-500/5"
            )}
          >
            <div className="flex items-center gap-2">
              {result.status === "OPTIMAL" ? (
                <Check className="size-4 text-green-400" />
              ) : result.status === "FEASIBLE" ? (
                <AlertCircle className="size-4 text-amber-400" />
              ) : (
                <AlertCircle className="size-4 text-red-400" />
              )}
              <span className="text-sm font-medium capitalize">
                {result.status.toLowerCase()} Solution
              </span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">ULDs used:</span>
                <span className="ml-1 font-medium">{result.stats.uldsUsed}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Avg volume:</span>
                <span className="ml-1 font-medium">
                  {Math.round(result.stats.avgVolumeUtilization * 100)}%
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Time:</span>
                <span className="ml-1 font-medium">{result.computationTimeMs}ms</span>
              </div>
              <div>
                <span className="text-muted-foreground">Unassigned:</span>
                <span className="ml-1 font-medium">{result.unassignedCargoIds.length}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

