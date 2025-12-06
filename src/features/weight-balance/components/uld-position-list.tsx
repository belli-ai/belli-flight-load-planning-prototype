"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Box,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Weight,
  Percent,
  Package,
  ChevronRight,
} from "lucide-react";
import type { UldAssignmentResult } from "@/features/planning";

// ============================================================================
// TYPES
// ============================================================================

type UldPositionListProps = {
  assignments: UldAssignmentResult[];
  selectedIndex?: number;
  onSelect?: (index: number) => void;
  onReorder?: (fromIndex: number, toIndex: number) => void;
  className?: string;
  compact?: boolean;
};

type DeckGroup = {
  deck: "MAIN" | "LOWER" | "UNASSIGNED";
  label: string;
  assignments: { assignment: UldAssignmentResult; originalIndex: number }[];
  totalWeight: number;
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getDeckFromPosition(
  positionCode: string | null
): "MAIN" | "LOWER" | "UNASSIGNED" {
  if (!positionCode) return "UNASSIGNED";

  // Main deck positions typically start with numbers like 11, 12, 21, etc.
  if (/^\d/.test(positionCode)) return "MAIN";

  // Lower deck positions: FWD, AFT, BULK
  if (
    positionCode.startsWith("FWD") ||
    positionCode.startsWith("AFT") ||
    positionCode === "BULK"
  ) {
    return "LOWER";
  }

  return "UNASSIGNED";
}

function getUtilizationColor(utilization: number): string {
  if (utilization >= 0.85) return "text-green-500";
  if (utilization >= 0.6) return "text-yellow-500";
  return "text-orange-500";
}

function getUtilizationBg(utilization: number): string {
  if (utilization >= 0.85) return "bg-green-500/10";
  if (utilization >= 0.6) return "bg-yellow-500/10";
  return "bg-orange-500/10";
}

// ============================================================================
// ULD ITEM COMPONENT
// ============================================================================

function UldItem({
  assignment,
  index,
  isSelected,
  onSelect,
  compact,
}: {
  assignment: UldAssignmentResult;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "group flex items-center gap-3 p-3 rounded-sm border cursor-pointer transition-all",
        isSelected
          ? "border-primary bg-primary/5"
          : "border-border hover:border-muted-foreground/30 hover:bg-muted/30"
      )}
      onClick={onSelect}
    >
      {/* Drag handle */}
      <div className="text-muted-foreground/40 group-hover:text-muted-foreground cursor-grab">
        <GripVertical className="size-4" />
      </div>

      {/* ULD icon and type */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <div
          className={cn(
            "p-1.5 rounded-sm shrink-0",
            getUtilizationBg(assignment.volumeUtilization)
          )}
        >
          <Box
            className={cn(
              "size-4",
              getUtilizationColor(assignment.volumeUtilization)
            )}
          />
        </div>
        <div className="min-w-0">
          <div className="font-medium text-sm truncate">
            {assignment.uldTypeCode}
          </div>
          {!compact && (
            <div className="text-[10px] text-muted-foreground truncate">
              {assignment.uldNumber || `Virtual #${index + 1}`}
            </div>
          )}
        </div>
      </div>

      {/* Position */}
      <div className="shrink-0">
        <Badge
          variant="outline"
          className={cn(
            "text-xs",
            assignment.positionCode
              ? "border-primary/30 text-primary"
              : "border-muted-foreground/30 text-muted-foreground"
          )}
        >
          {assignment.positionCode || "Unassigned"}
        </Badge>
      </div>

      {/* Stats */}
      {!compact && (
        <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
          <div
            className="flex items-center gap-1 whitespace-nowrap"
            title="Weight"
          >
            <Weight className="size-3 shrink-0" />
            <span>{assignment.totalWeightKg.toLocaleString()}</span>
          </div>
          <div
            className={cn(
              "flex items-center gap-1 whitespace-nowrap",
              getUtilizationColor(assignment.volumeUtilization)
            )}
            title="Volume utilization"
          >
            <Percent className="size-3 shrink-0" />
            <span>{Math.round(assignment.volumeUtilization * 100)}</span>
          </div>
          <div
            className="flex items-center gap-1 whitespace-nowrap"
            title="Items"
          >
            <Package className="size-3 shrink-0" />
            <span>{assignment.cargoItems.length}</span>
          </div>
        </div>
      )}

      {/* Chevron */}
      <ChevronRight
        className={cn(
          "size-4 text-muted-foreground/40 transition-transform",
          isSelected && "text-primary rotate-90"
        )}
      />
    </div>
  );
}

// ============================================================================
// DECK GROUP COMPONENT
// ============================================================================

function DeckGroupSection({
  group,
  selectedIndex,
  onSelect,
  compact,
}: {
  group: DeckGroup;
  selectedIndex?: number;
  onSelect: (index: number) => void;
  compact?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  const deckIcons = {
    MAIN: <ArrowUp className="size-3.5" />,
    LOWER: <ArrowDown className="size-3.5" />,
    UNASSIGNED: <Box className="size-3.5" />,
  };

  return (
    <div className="space-y-2">
      {/* Deck header */}
      <button
        className="flex items-center justify-between w-full px-2 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          {deckIcons[group.deck]}
          <span>{group.label}</span>
          <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
            {group.assignments.length}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">
            {group.totalWeight.toLocaleString()} kg
          </span>
          <ChevronRight
            className={cn(
              "size-3.5 transition-transform",
              isExpanded && "rotate-90"
            )}
          />
        </div>
      </button>

      {/* ULD items */}
      {isExpanded && (
        <div className="space-y-1.5">
          {group.assignments.map(({ assignment, originalIndex }) => (
            <UldItem
              key={originalIndex}
              assignment={assignment}
              index={originalIndex}
              isSelected={selectedIndex === originalIndex}
              onSelect={() => onSelect(originalIndex)}
              compact={compact}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function UldPositionList({
  assignments,
  selectedIndex,
  onSelect,
  onReorder,
  className,
  compact = false,
}: UldPositionListProps) {
  // Group assignments by deck
  const deckGroups: DeckGroup[] = [
    {
      deck: "MAIN",
      label: "Main Deck",
      assignments: [],
      totalWeight: 0,
    },
    {
      deck: "LOWER",
      label: "Lower Deck",
      assignments: [],
      totalWeight: 0,
    },
    {
      deck: "UNASSIGNED",
      label: "Unassigned",
      assignments: [],
      totalWeight: 0,
    },
  ];

  assignments.forEach((assignment, index) => {
    const deck = getDeckFromPosition(assignment.positionCode);
    const group = deckGroups.find((g) => g.deck === deck)!;
    group.assignments.push({ assignment, originalIndex: index });
    group.totalWeight += assignment.totalWeightKg;
  });

  // Filter out empty groups
  const nonEmptyGroups = deckGroups.filter((g) => g.assignments.length > 0);

  // Calculate totals
  const totalWeight = assignments.reduce(
    (sum, a) => sum + parseFloat(String(a.totalWeightKg)),
    0
  );
  const avgUtilization =
    assignments.length > 0
      ? assignments.reduce((sum, a) => sum + a.volumeUtilization, 0) /
        assignments.length
      : 0;

  if (assignments.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Box className="size-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">No ULDs to display</p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Run optimization from the Build-Up page first
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2 shrink-0">
            <Box className="size-4 text-primary" />
            ULD Assignments
          </CardTitle>
          <div className="flex items-center flex-wrap justify-end gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="whitespace-nowrap">{assignments.length} ULDs</span>
            <span className="whitespace-nowrap">
              {totalWeight.toLocaleString()} kg
            </span>
            <span
              className={cn(
                "whitespace-nowrap",
                getUtilizationColor(avgUtilization)
              )}
            >
              {Math.round(avgUtilization * 100)}% avg
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {nonEmptyGroups.map((group) => (
          <DeckGroupSection
            key={group.deck}
            group={group}
            selectedIndex={selectedIndex}
            onSelect={(idx) => onSelect?.(idx)}
            compact={compact}
          />
        ))}
      </CardContent>
    </Card>
  );
}
