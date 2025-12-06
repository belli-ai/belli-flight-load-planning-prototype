"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  Package,
  ChevronDown,
  ChevronUp,
  Box,
  Snowflake,
  Loader2,
  AlertCircle,
} from "lucide-react";
import type { AvailableUldDisplay } from "../actions/optimize.actions";

// ============================================================================
// TYPES
// ============================================================================

type UldSelectorProps = {
  /** Available ULDs from inventory */
  availableUlds: AvailableUldDisplay[];
  /** Currently selected ULD IDs */
  selectedUldIds: string[];
  /** Callback when selection changes */
  onSelectionChange: (uldIds: string[]) => void;
  /** Is data loading */
  isLoading?: boolean;
  /** Disable selection (e.g., during optimization) */
  disabled?: boolean;
  /** Required cargo weight (to show capacity warning) */
  requiredWeightKg?: number;
  /** Required cargo volume (to show capacity warning) */
  requiredVolumeM3?: number;
};

// ============================================================================
// COMPONENT
// ============================================================================

export function UldSelector({
  availableUlds,
  selectedUldIds,
  onSelectionChange,
  isLoading = false,
  disabled = false,
  requiredWeightKg = 0,
  requiredVolumeM3 = 0,
}: UldSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filterType, setFilterType] = useState<string | null>(null);

  // Group ULDs by type for easier selection
  const uldsByType = availableUlds.reduce((acc, uld) => {
    const type = uld.uldTypeCode;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(uld);
    return acc;
  }, {} as Record<string, AvailableUldDisplay[]>);

  const uldTypes = Object.keys(uldsByType).sort();

  // Filter ULDs by selected type
  const filteredUlds = filterType
    ? availableUlds.filter((u) => u.uldTypeCode === filterType)
    : availableUlds;

  // Calculate total selected capacity
  const selectedUlds = availableUlds.filter((u) =>
    selectedUldIds.includes(u.id)
  );
  const totalSelectedPayloadKg = selectedUlds.reduce(
    (sum, u) => sum + u.maxPayloadKg,
    0
  );
  const totalSelectedVolumeM3 = selectedUlds.reduce(
    (sum, u) => sum + u.maxVolumeM3,
    0
  );

  // Check if selected capacity is sufficient
  const hasInsufficientWeight = requiredWeightKg > 0 && totalSelectedPayloadKg < requiredWeightKg;
  const hasInsufficientVolume = requiredVolumeM3 > 0 && totalSelectedVolumeM3 < requiredVolumeM3;

  const handleToggleUld = (uldId: string) => {
    if (disabled) return;
    if (selectedUldIds.includes(uldId)) {
      onSelectionChange(selectedUldIds.filter((id) => id !== uldId));
    } else {
      onSelectionChange([...selectedUldIds, uldId]);
    }
  };

  const handleSelectAllOfType = (typeCode: string) => {
    if (disabled) return;
    const typeUlds = uldsByType[typeCode] || [];
    const typeUldIds = typeUlds.map((u) => u.id);
    const alreadySelected = typeUldIds.filter((id) =>
      selectedUldIds.includes(id)
    );

    if (alreadySelected.length === typeUldIds.length) {
      // Deselect all of this type
      onSelectionChange(selectedUldIds.filter((id) => !typeUldIds.includes(id)));
    } else {
      // Select all of this type
      const newIds = new Set([...selectedUldIds, ...typeUldIds]);
      onSelectionChange(Array.from(newIds));
    }
  };

  const handleClearSelection = () => {
    if (disabled) return;
    onSelectionChange([]);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="size-4 text-primary" />
            ULD Selection
            {selectedUldIds.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {selectedUldIds.length} selected
              </Badge>
            )}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-7 w-7 p-0"
          >
            {isExpanded ? (
              <ChevronUp className="size-4" />
            ) : (
              <ChevronDown className="size-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Summary row */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {selectedUldIds.length === 0
              ? "No ULDs selected (auto-select best fit)"
              : `${selectedUldIds.length} ULD(s) will be used`}
          </span>
          {selectedUldIds.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearSelection}
              disabled={disabled}
              className="h-6 text-xs"
            >
              Clear
            </Button>
          )}
        </div>

        {/* Capacity summary */}
        {selectedUldIds.length > 0 && (
          <div className="rounded-sm border border-border bg-background/50 p-2 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Total payload capacity:</span>
              <span
                className={cn(
                  "font-medium",
                  hasInsufficientWeight && "text-amber-400"
                )}
              >
                {totalSelectedPayloadKg.toLocaleString()} kg
                {requiredWeightKg > 0 && (
                  <span className="text-muted-foreground ml-1">
                    / {requiredWeightKg.toLocaleString()} kg needed
                  </span>
                )}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Total volume capacity:</span>
              <span
                className={cn(
                  "font-medium",
                  hasInsufficientVolume && "text-amber-400"
                )}
              >
                {totalSelectedVolumeM3.toFixed(2)} m³
                {requiredVolumeM3 > 0 && (
                  <span className="text-muted-foreground ml-1">
                    / {requiredVolumeM3.toFixed(2)} m³ needed
                  </span>
                )}
              </span>
            </div>
            {(hasInsufficientWeight || hasInsufficientVolume) && (
              <div className="flex items-center gap-1 text-xs text-amber-400 mt-1">
                <AlertCircle className="size-3" />
                <span>Selected ULDs may have insufficient capacity</span>
              </div>
            )}
          </div>
        )}

        {/* Expanded content */}
        {isExpanded && (
          <div className="space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">
                  Loading available ULDs...
                </span>
              </div>
            ) : availableUlds.length === 0 ? (
              <div className="py-4 text-center text-sm text-muted-foreground">
                No available ULDs at this location
              </div>
            ) : (
              <>
                {/* Type filter */}
                <div className="flex flex-wrap gap-1">
                  <Button
                    variant={filterType === null ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setFilterType(null)}
                    className="h-6 text-xs"
                  >
                    All ({availableUlds.length})
                  </Button>
                  {uldTypes.map((type) => (
                    <Button
                      key={type}
                      variant={filterType === type ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setFilterType(type)}
                      className="h-6 text-xs"
                    >
                      {type} ({uldsByType[type].length})
                    </Button>
                  ))}
                </div>

                {/* Quick select by type */}
                {filterType && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSelectAllOfType(filterType)}
                    disabled={disabled}
                    className="w-full h-7 text-xs"
                  >
                    Select all {filterType} ULDs
                  </Button>
                )}

                {/* ULD list */}
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {filteredUlds.map((uld) => {
                    const isSelected = selectedUldIds.includes(uld.id);
                    return (
                      <label
                        key={uld.id}
                        className={cn(
                          "flex items-center gap-2 rounded-sm border p-2 cursor-pointer transition-colors",
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-muted-foreground",
                          disabled && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleToggleUld(uld.id)}
                          disabled={disabled}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-medium">
                              {uld.uldNumber}
                            </span>
                            <Badge variant="outline" className="text-[9px] px-1 py-0">
                              {uld.uldTypeCode}
                            </Badge>
                            {uld.isRefrigerated && (
                              <Snowflake className="size-3 text-blue-400" />
                            )}
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-2">
                            <span>{uld.maxPayloadKg.toLocaleString()} kg</span>
                            <span>{uld.maxVolumeM3.toFixed(1)} m³</span>
                            {uld.ownerCode && (
                              <span className="text-muted-foreground/70">
                                ({uld.ownerCode})
                              </span>
                            )}
                          </div>
                        </div>
                        <Box
                          className={cn(
                            "size-4",
                            uld.category === "PALLET"
                              ? "text-amber-400"
                              : "text-blue-400"
                          )}
                        />
                      </label>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

