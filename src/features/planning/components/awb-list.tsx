"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import {
  Search,
  AlertTriangle,
  Snowflake,
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  FileText,
  Boxes,
  Check,
  Minus,
} from "lucide-react";
import type { AwbWithParcelsDisplay, ParcelDisplay } from "../actions/optimize.actions";
import type { CargoItemDisplay } from "@/features/cargo";
import { getColorForAwb } from "../lib/utils/colors";

// ============================================================================
// TYPES
// ============================================================================

type AwbListProps = {
  awbs: AwbWithParcelsDisplay[];
  cargoItems: CargoItemDisplay[];
  selectedCargoIds: string[];
  onSelectionChange: (ids: string[]) => void;
};

type SortField = "awbNumber" | "totalWeightKg" | "totalPieces" | "status";
type SortDirection = "asc" | "desc";

// ============================================================================
// COMPONENT
// ============================================================================

export function AwbList({
  awbs,
  cargoItems,
  selectedCargoIds,
  onSelectionChange,
}: AwbListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("awbNumber");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [expandedAwbs, setExpandedAwbs] = useState<Set<string>>(new Set());

  // Group cargo items by AWB ID
  const cargoByAwb = useMemo(() => {
    const map = new Map<string, CargoItemDisplay[]>();
    for (const item of cargoItems) {
      const items = map.get(item.awbId) ?? [];
      items.push(item);
      map.set(item.awbId, items);
    }
    return map;
  }, [cargoItems]);

  // Filter items
  const filteredAwbs = awbs.filter(
    (awb) =>
      awb.awbNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      awb.natureOfGoods?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      awb.shipperName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      awb.consigneeName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort items
  const sortedAwbs = [...filteredAwbs].sort((a, b) => {
    const modifier = sortDirection === "asc" ? 1 : -1;
    switch (sortField) {
      case "totalWeightKg":
        return (a.totalWeightKg - b.totalWeightKg) * modifier;
      case "totalPieces":
        return (a.totalPieces - b.totalPieces) * modifier;
      case "status":
        return (a.status ?? "").localeCompare(b.status ?? "") * modifier;
      default:
        return a.awbNumber.localeCompare(b.awbNumber) * modifier;
    }
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const toggleExpand = (awbId: string) => {
    setExpandedAwbs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(awbId)) {
        newSet.delete(awbId);
      } else {
        newSet.add(awbId);
      }
      return newSet;
    });
  };

  // Selection handlers
  const handleSelectAll = () => {
    const allCargoIds = cargoItems.map((c) => c.id);
    if (selectedCargoIds.length === allCargoIds.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(allCargoIds);
    }
  };

  const handleSelectAwb = (awbId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const awbCargoItems = cargoByAwb.get(awbId) ?? [];
    const awbCargoIds = awbCargoItems.map((c) => c.id);
    
    const allSelected = awbCargoIds.every((id) => selectedCargoIds.includes(id));
    
    if (allSelected) {
      // Deselect all cargo items in this AWB
      onSelectionChange(selectedCargoIds.filter((id) => !awbCargoIds.includes(id)));
    } else {
      // Select all cargo items in this AWB
      const newSelection = new Set(selectedCargoIds);
      awbCargoIds.forEach((id) => newSelection.add(id));
      onSelectionChange(Array.from(newSelection));
    }
  };

  const handleSelectCargoItem = (cargoItemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedCargoIds.includes(cargoItemId)) {
      onSelectionChange(selectedCargoIds.filter((id) => id !== cargoItemId));
    } else {
      onSelectionChange([...selectedCargoIds, cargoItemId]);
    }
  };

  const getAwbSelectionState = (awbId: string): "none" | "partial" | "all" => {
    const awbCargoItems = cargoByAwb.get(awbId) ?? [];
    if (awbCargoItems.length === 0) return "none";
    
    const selectedCount = awbCargoItems.filter((c) => 
      selectedCargoIds.includes(c.id)
    ).length;
    
    if (selectedCount === 0) return "none";
    if (selectedCount === awbCargoItems.length) return "all";
    return "partial";
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "LOADED":
        return "bg-green-500/20 text-green-400";
      case "RECEIVED":
        return "bg-blue-500/20 text-blue-400";
      case "BOOKED":
        return "bg-amber-500/20 text-amber-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const hasSpecialHandling = (codes: string[] | null) => {
    if (!codes) return { hasDG: false, hasCold: false };
    return {
      hasDG: codes.some((c) => ["DGR", "RRE", "RRW", "RRY", "CAO"].includes(c)),
      hasCold: codes.some((c) => ["COL", "FRO", "PER", "PEP"].includes(c)),
    };
  };

  // Calculate totals
  const totalWeight = sortedAwbs.reduce((sum, a) => sum + a.totalWeightKg, 0);
  const totalPieces = sortedAwbs.reduce((sum, a) => sum + a.totalPieces, 0);
  
  // Selected stats
  const selectedWeight = cargoItems
    .filter((c) => selectedCargoIds.includes(c.id))
    .reduce((sum, c) => sum + c.weightKg, 0);

  const formatNumber = (num: number) => num.toLocaleString("en-US");

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="size-4 text-primary" />
            Air Waybills
            <span className="ml-1 text-sm font-normal text-muted-foreground">
              ({sortedAwbs.length})
            </span>
          </CardTitle>
          <div className="flex items-center gap-4 text-xs">
            <span className="text-muted-foreground">
              Selected: {selectedCargoIds.length} items
            </span>
            <span className="text-primary font-medium">
              {formatNumber(selectedWeight)} kg
            </span>
          </div>
        </div>

        {/* Search */}
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by AWB, shipper, consignee, or goods..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-auto p-0">
        <Table>
          <TableHeader className="sticky top-0 bg-card">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10">
                <button
                  onClick={handleSelectAll}
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-sm border transition-colors",
                    selectedCargoIds.length === cargoItems.length && cargoItems.length > 0
                      ? "border-primary bg-primary text-primary-foreground"
                      : selectedCargoIds.length > 0
                        ? "border-primary bg-primary/20 text-primary"
                        : "border-border hover:border-primary"
                  )}
                >
                  {selectedCargoIds.length === cargoItems.length && cargoItems.length > 0 ? (
                    <Check className="size-3" />
                  ) : selectedCargoIds.length > 0 ? (
                    <Minus className="size-3" />
                  ) : null}
                </button>
              </TableHead>
              <TableHead className="w-8" />
              <TableHead>
                <button
                  onClick={() => handleSort("awbNumber")}
                  className="flex items-center gap-1 hover:text-foreground"
                >
                  AWB Number
                  <ArrowUpDown className="size-3" />
                </button>
              </TableHead>
              <TableHead>Route</TableHead>
              <TableHead className="text-right">
                <button
                  onClick={() => handleSort("totalPieces")}
                  className="flex items-center gap-1 hover:text-foreground ml-auto"
                >
                  Pieces
                  <ArrowUpDown className="size-3" />
                </button>
              </TableHead>
              <TableHead className="text-right">
                <button
                  onClick={() => handleSort("totalWeightKg")}
                  className="flex items-center gap-1 hover:text-foreground ml-auto"
                >
                  Weight
                  <ArrowUpDown className="size-3" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort("status")}
                  className="flex items-center gap-1 hover:text-foreground"
                >
                  Status
                  <ArrowUpDown className="size-3" />
                </button>
              </TableHead>
              <TableHead>SHC</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedAwbs.map((awb) => {
              const isExpanded = expandedAwbs.has(awb.id);
              const awbColor = getColorForAwb(awb.awbNumber);
              const { hasDG, hasCold } = hasSpecialHandling(awb.specialHandlingCodes);
              const selectionState = getAwbSelectionState(awb.id);
              const awbCargoItems = cargoByAwb.get(awb.id) ?? [];

              return (
                <Collapsible key={awb.id} open={isExpanded} asChild>
                  <>
                    <TableRow
                      className={cn(
                        "cursor-pointer transition-colors",
                        isExpanded && "bg-primary/5",
                        selectionState !== "none" && "bg-primary/5"
                      )}
                      onClick={() => toggleExpand(awb.id)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleSelectAwb(awb.id, e)}
                          className={cn(
                            "flex h-5 w-5 items-center justify-center rounded-sm border transition-colors",
                            selectionState === "all"
                              ? "border-primary bg-primary text-primary-foreground"
                              : selectionState === "partial"
                                ? "border-primary bg-primary/20 text-primary"
                                : "border-border hover:border-primary"
                          )}
                        >
                          {selectionState === "all" ? (
                            <Check className="size-3" />
                          ) : selectionState === "partial" ? (
                            <Minus className="size-3" />
                          ) : null}
                        </button>
                      </TableCell>
                      <TableCell className="w-8">
                        <CollapsibleTrigger asChild>
                          <button className="p-1 hover:bg-muted rounded-sm">
                            {isExpanded ? (
                              <ChevronDown className="size-4" />
                            ) : (
                              <ChevronRight className="size-4" />
                            )}
                          </button>
                        </CollapsibleTrigger>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-8 w-1 rounded-full"
                            style={{ backgroundColor: awbColor }}
                          />
                          <div>
                            <div className="font-medium text-sm">{awb.awbNumber}</div>
                            <div className="text-xs text-muted-foreground truncate max-w-[180px]">
                              {awb.natureOfGoods || "General cargo"}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-mono">
                          {awb.originCode} → {awb.destinationCode}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {awb.totalPieces}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatNumber(awb.totalWeightKg)} kg
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex rounded-sm px-1.5 py-0.5 text-[10px] font-medium uppercase",
                            getStatusColor(awb.status)
                          )}
                        >
                          {awb.status || "UNKNOWN"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {hasDG && (
                            <span className="flex items-center gap-0.5 rounded-sm bg-red-500/20 px-1 py-0.5 text-[10px] text-red-400">
                              <AlertTriangle className="size-2.5" />
                              DGR
                            </span>
                          )}
                          {hasCold && (
                            <span className="flex items-center gap-0.5 rounded-sm bg-cyan-500/20 px-1 py-0.5 text-[10px] text-cyan-400">
                              <Snowflake className="size-2.5" />
                              TEMP
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                    <CollapsibleContent asChild>
                      <tr>
                        <td colSpan={8} className="p-0 border-0">
                          <div className="bg-muted/30 border-y border-border p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <Boxes className="size-4 text-muted-foreground" />
                              <span className="text-sm font-medium">
                                Cargo Items ({awbCargoItems.length})
                              </span>
                            </div>
                            {awbCargoItems.length > 0 ? (
                              <div className="grid gap-2">
                                {awbCargoItems.map((item) => (
                                  <CargoItemCard
                                    key={item.id}
                                    item={item}
                                    awbColor={awbColor}
                                    isSelected={selectedCargoIds.includes(item.id)}
                                    onSelect={handleSelectCargoItem}
                                  />
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                No cargo items for this AWB
                              </p>
                            )}
                          </div>
                        </td>
                      </tr>
                    </CollapsibleContent>
                  </>
                </Collapsible>
              );
            })}
          </TableBody>
        </Table>

        {sortedAwbs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <FileText className="mb-3 size-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              {searchQuery ? "No matching AWBs found" : "No AWBs for this flight"}
            </p>
          </div>
        )}
      </CardContent>

      {/* Footer stats */}
      <div className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
        <div className="flex justify-between">
          <span>Total AWBs: {sortedAwbs.length} • {totalPieces} pieces</span>
          <span>Total weight: {formatNumber(totalWeight)} kg</span>
        </div>
      </div>
    </Card>
  );
}

// ============================================================================
// CARGO ITEM CARD SUBCOMPONENT
// ============================================================================

function CargoItemCard({
  item,
  awbColor,
  isSelected,
  onSelect,
}: {
  item: CargoItemDisplay;
  awbColor: string;
  isSelected: boolean;
  onSelect: (id: string, e: React.MouseEvent) => void;
}) {
  const hasDG = item.isDangerousGoods;
  const hasCold = item.specialHandling.some((c) => ["COL", "FRO", "PER", "PEP"].includes(c));

  return (
    <div
      className={cn(
        "flex items-center justify-between bg-background rounded-md p-3 border transition-colors cursor-pointer",
        isSelected ? "border-primary bg-primary/5" : "border-border/50 hover:border-border"
      )}
      onClick={(e) => onSelect(item.id, e)}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={(e) => onSelect(item.id, e)}
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded-sm border transition-colors",
            isSelected
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border hover:border-primary"
          )}
        >
          {isSelected && <Check className="size-3" />}
        </button>
        <div
          className="h-6 w-1 rounded-full opacity-50"
          style={{ backgroundColor: awbColor }}
        />
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              Piece #{item.pieceNumber}
            </span>
            {item.description && (
              <span className="text-xs text-muted-foreground">
                • {item.description}
              </span>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            {item.priority} priority
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="text-sm font-mono">
            {item.weightKg.toLocaleString("en-US")} kg
          </div>
          <div className="text-xs text-muted-foreground font-mono">
            {item.lengthCm}×{item.widthCm}×{item.heightCm} cm
          </div>
        </div>
        <div className="flex items-center gap-1">
          {item.isStackable && (
            <span className="rounded-sm bg-green-500/20 px-1.5 py-0.5 text-[10px] text-green-400">
              STACK
            </span>
          )}
          {hasDG && (
            <span className="flex items-center gap-0.5 rounded-sm bg-red-500/20 px-1 py-0.5 text-[10px] text-red-400">
              <AlertTriangle className="size-2.5" />
            </span>
          )}
          {hasCold && (
            <span className="flex items-center gap-0.5 rounded-sm bg-cyan-500/20 px-1 py-0.5 text-[10px] text-cyan-400">
              <Snowflake className="size-2.5" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
