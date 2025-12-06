"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  Package,
  Search,
  AlertTriangle,
  Snowflake,
  ArrowUpDown,
  Check,
  X,
} from "lucide-react";
import type { CargoItemDisplay } from "@/features/cargo";
import { getColorForAwb } from "../lib/utils/colors";

// ============================================================================
// TYPES
// ============================================================================

type CargoListProps = {
  items: CargoItemDisplay[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onItemClick?: (item: CargoItemDisplay) => void;
};

type SortField = "awbNumber" | "weightKg" | "priority" | "loadStatus";
type SortDirection = "asc" | "desc";

// ============================================================================
// COMPONENT
// ============================================================================

export function CargoList({
  items,
  selectedIds,
  onSelectionChange,
  onItemClick,
}: CargoListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("awbNumber");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Filter items
  const filteredItems = items.filter(
    (item) =>
      item.awbNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort items
  const sortedItems = [...filteredItems].sort((a, b) => {
    const modifier = sortDirection === "asc" ? 1 : -1;
    switch (sortField) {
      case "weightKg":
        return (a.weightKg - b.weightKg) * modifier;
      case "priority":
        const priorityOrder = { HIGH: 0, MEDIUM: 1, STANDARD: 2, LOW: 3 };
        return (
          (priorityOrder[a.priority] - priorityOrder[b.priority]) * modifier
        );
      case "loadStatus":
        return a.loadStatus.localeCompare(b.loadStatus) * modifier;
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

  const handleSelectAll = () => {
    if (selectedIds.length === sortedItems.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(sortedItems.map((i) => i.id));
    }
  };

  const handleSelectItem = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((i) => i !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "bg-red-500/20 text-red-400";
      case "MEDIUM":
        return "bg-amber-500/20 text-amber-400";
      case "LOW":
        return "bg-blue-500/20 text-blue-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ASSIGNED":
        return "text-green-400";
      case "LOADED":
        return "text-blue-400";
      case "PENDING":
        return "text-muted-foreground";
      default:
        return "text-muted-foreground";
    }
  };

  // Calculate totals
  const totalWeight = sortedItems.reduce((sum, i) => sum + i.weightKg, 0);
  const selectedWeight = items
    .filter((i) => selectedIds.includes(i.id))
    .reduce((sum, i) => sum + i.weightKg, 0);

  // Format number consistently for SSR/client hydration
  const formatNumber = (num: number) => num.toLocaleString("en-US");

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="size-4 text-primary" />
            Cargo Items
            <span className="ml-1 text-sm font-normal text-muted-foreground">
              ({sortedItems.length})
            </span>
          </CardTitle>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">
              Selected: {selectedIds.length} items
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
            placeholder="Search by AWB or description..."
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
                    selectedIds.length === sortedItems.length && sortedItems.length > 0
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:border-primary"
                  )}
                >
                  {selectedIds.length === sortedItems.length && sortedItems.length > 0 && (
                    <Check className="size-3" />
                  )}
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort("awbNumber")}
                  className="flex items-center gap-1 hover:text-foreground"
                >
                  AWB / Piece
                  <ArrowUpDown className="size-3" />
                </button>
              </TableHead>
              <TableHead className="text-right">
                <button
                  onClick={() => handleSort("weightKg")}
                  className="flex items-center gap-1 hover:text-foreground ml-auto"
                >
                  Weight
                  <ArrowUpDown className="size-3" />
                </button>
              </TableHead>
              <TableHead>Dimensions</TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort("priority")}
                  className="flex items-center gap-1 hover:text-foreground"
                >
                  Priority
                  <ArrowUpDown className="size-3" />
                </button>
              </TableHead>
              <TableHead>SHC</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedItems.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              const awbColor = getColorForAwb(item.awbNumber);

              return (
                <TableRow
                  key={item.id}
                  className={cn(
                    "cursor-pointer transition-colors",
                    isSelected && "bg-primary/5"
                  )}
                  onClick={() => onItemClick?.(item)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleSelectItem(item.id)}
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-sm border transition-colors",
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:border-primary"
                      )}
                    >
                      {isSelected && <Check className="size-3" />}
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-8 w-1 rounded-full"
                        style={{ backgroundColor: awbColor }}
                      />
                      <div>
                        <div className="font-medium text-sm">{item.awbNumber}</div>
                        <div className="text-xs text-muted-foreground">
                          Piece #{item.pieceNumber}
                          {item.description && ` • ${item.description}`}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatNumber(item.weightKg)} kg
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono">
                    {item.lengthCm}×{item.widthCm}×{item.heightCm}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex rounded-sm px-1.5 py-0.5 text-[10px] font-medium uppercase",
                        getPriorityColor(item.priority)
                      )}
                    >
                      {item.priority}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {item.isDangerousGoods && (
                        <span className="flex items-center gap-0.5 rounded-sm bg-red-500/20 px-1 py-0.5 text-[10px] text-red-400">
                          <AlertTriangle className="size-2.5" />
                          DGR
                        </span>
                      )}
                      {item.specialHandling.includes("COL") && (
                        <span className="flex items-center gap-0.5 rounded-sm bg-cyan-500/20 px-1 py-0.5 text-[10px] text-cyan-400">
                          <Snowflake className="size-2.5" />
                          COL
                        </span>
                      )}
                      {item.specialHandling.includes("HEA") && (
                        <span className="rounded-sm bg-purple-500/20 px-1 py-0.5 text-[10px] text-purple-400">
                          HEA
                        </span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {sortedItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <Package className="mb-3 size-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              {searchQuery ? "No matching cargo items" : "No cargo items available"}
            </p>
          </div>
        )}
      </CardContent>

      {/* Footer stats */}
      <div className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
        <div className="flex justify-between">
          <span>Total items: {sortedItems.length}</span>
          <span>Total weight: {formatNumber(totalWeight)} kg</span>
        </div>
      </div>
    </Card>
  );
}

