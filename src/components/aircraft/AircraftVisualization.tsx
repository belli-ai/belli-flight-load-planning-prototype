"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface LoadingPosition {
  id: string;
  deckId: string;
  positionCode: string;
  sequenceNumber: number;
  maxWeightKg: string;
  armStationCm: string;
  compatibleUldTypes: string[] | null;
  acceptsBulkCargo: boolean;
  floorAreaM2: string | null;
  maxHeightCm: string | null;
  contourCode: string | null;
  colIndex: number | null;
  rowIndex: number | null;
}

interface DeckConfiguration {
  id: string;
  presetId?: string;
  aircraftId?: string; // For backwards compatibility
  deckCode: string;
  deckName: string;
  maxStructuralWeightKg: string | null;
  sequence: number;
  positions: LoadingPosition[];
  positionCount: number;
  totalMaxWeight?: number;
}

interface Aircraft {
  id: string;
  name: string;
  typeCode: string;
  subtype?: string | null;
  registration?: string | null;
  mainDeckMaxWeightKg?: string;
  lowerDeckMaxWeightKg?: string;
  totalMaxPayloadKg?: string;
  maxZeroFuelWeightKg?: string;
  maxTakeoffWeightKg?: string;
  maxLandingWeightKg?: string;
  operatingEmptyWeightKg?: string;
  decks: DeckConfiguration[];
  deckCount: number;
  totalPositions: number;
}

interface AircraftVisualizationProps {
  aircraft: Aircraft;
  selectedPosition?: string | null;
  onPositionClick?: (position: LoadingPosition, deck: DeckConfiguration) => void;
  positionStatus?: Record<string, { status: "empty" | "loaded" | "selected"; weight?: number }>;
  showWeights?: boolean;
}

export function AircraftVisualization({
  aircraft,
  selectedPosition,
  onPositionClick,
  positionStatus = {},
  showWeights = false,
}: AircraftVisualizationProps) {
  // Sort decks by sequence
  const sortedDecks = useMemo(
    () => [...aircraft.decks].sort((a, b) => a.sequence - b.sequence),
    [aircraft.decks]
  );

  // Separate main deck and lower decks
  const mainDeck = sortedDecks.find((d) => d.deckCode === "MAIN" || d.deckCode.includes("MAIN"));
  const lowerDecks = sortedDecks.filter(
    (d) => d.deckCode !== "MAIN" && !d.deckCode.includes("MAIN")
  );

  // Calculate positions grid
  const getPositionGrid = (positions: LoadingPosition[]) => {
    const maxCol = Math.max(...positions.map((p) => p.colIndex ?? 0), 0);
    const maxRow = Math.max(...positions.map((p) => p.rowIndex ?? 0), 0);
    const grid: (LoadingPosition | null)[][] = [];

    for (let row = 0; row <= maxRow; row++) {
      grid[row] = [];
      for (let col = 0; col <= maxCol; col++) {
        const pos = positions.find((p) => p.colIndex === col && p.rowIndex === row);
        grid[row][col] = pos || null;
      }
    }
    return grid;
  };

  return (
    <div className="relative w-full">
      {/* Aircraft Outline Container */}
      <div className="relative mx-auto max-w-4xl">
        {/* Aircraft Fuselage */}
        <svg
          viewBox="0 0 800 240"
          className="w-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Aircraft body gradient */}
          <defs>
            <linearGradient id="fuselageGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--color-muted)" stopOpacity="0.6" />
              <stop offset="50%" stopColor="var(--color-muted)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="var(--color-muted)" stopOpacity="0.6" />
            </linearGradient>
            <linearGradient id="noseGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--color-muted)" stopOpacity="0.8" />
              <stop offset="100%" stopColor="var(--color-muted)" stopOpacity="0.3" />
            </linearGradient>
            <linearGradient id="tailGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--color-muted)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="var(--color-muted)" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {/* Fuselage outline */}
          <path
            d="M 80 120 
               Q 20 120 20 120 
               L 40 90 Q 60 70 100 70 
               L 680 70 
               Q 720 70 740 90 
               L 780 120 
               L 740 150 Q 720 170 680 170 
               L 100 170 
               Q 60 170 40 150 
               Z"
            fill="url(#fuselageGradient)"
            stroke="var(--color-border)"
            strokeWidth="2"
          />

          {/* Nose cone */}
          <ellipse
            cx="30"
            cy="120"
            rx="15"
            ry="30"
            fill="url(#noseGradient)"
            stroke="var(--color-border)"
            strokeWidth="1.5"
          />

          {/* Tail fin */}
          <path
            d="M 740 70 L 780 20 L 785 25 L 760 70"
            fill="var(--color-muted)"
            fillOpacity="0.5"
            stroke="var(--color-border)"
            strokeWidth="1.5"
          />

          {/* Engine 1 */}
          <ellipse cx="180" cy="185" rx="20" ry="8" fill="var(--color-muted)" stroke="var(--color-border)" strokeWidth="1" />
          <rect x="160" y="170" width="40" height="15" fill="var(--color-muted)" stroke="var(--color-border)" strokeWidth="1" rx="3" />

          {/* Engine 2 */}
          <ellipse cx="600" cy="185" rx="20" ry="8" fill="var(--color-muted)" stroke="var(--color-border)" strokeWidth="1" />
          <rect x="580" y="170" width="40" height="15" fill="var(--color-muted)" stroke="var(--color-border)" strokeWidth="1" rx="3" />

          {/* Wing indicators */}
          <line x1="200" y1="120" x2="200" y2="190" stroke="var(--color-border)" strokeWidth="1" strokeDasharray="4,4" opacity="0.5" />
          <line x1="580" y1="120" x2="580" y2="190" stroke="var(--color-border)" strokeWidth="1" strokeDasharray="4,4" opacity="0.5" />

          {/* Direction indicator */}
          <text x="50" y="210" fill="var(--color-muted-foreground)" fontSize="10" fontFamily="monospace">
            FWD ◀
          </text>
          <text x="720" y="210" fill="var(--color-muted-foreground)" fontSize="10" fontFamily="monospace">
            ▶ AFT
          </text>

          {/* Aircraft type label */}
          <text x="400" y="210" fill="var(--color-muted-foreground)" fontSize="12" fontFamily="monospace" textAnchor="middle">
            {aircraft.typeCode} - {aircraft.name}
          </text>
        </svg>

        {/* Deck Visualizations */}
        <div className="mt-4 space-y-6">
          {/* Main Deck */}
          {mainDeck && (
            <DeckVisualization
              deck={mainDeck}
              isMainDeck={true}
              selectedPosition={selectedPosition}
              onPositionClick={onPositionClick}
              positionStatus={positionStatus}
              showWeights={showWeights}
            />
          )}

          {/* Lower Decks */}
          {lowerDecks.length > 0 && (
            <div className="grid gap-4 md:grid-cols-3">
              {lowerDecks.map((deck) => (
                <DeckVisualization
                  key={deck.id}
                  deck={deck}
                  isMainDeck={false}
                  selectedPosition={selectedPosition}
                  onPositionClick={onPositionClick}
                  positionStatus={positionStatus}
                  showWeights={showWeights}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper to determine column span based on contour code
// FULL_WIDTH = 2 columns, ONE_COLUMN = 1 column
function getColumnSpan(position: LoadingPosition, isFirst: boolean): 1 | 2 {
  // First position always spans 2 columns
  if (isFirst) return 2;
  
  // ONE_COLUMN contour spans 1 column
  if (position.contourCode === "ONE_COLUMN") return 1;
  
  // FULL_WIDTH contour spans 2 columns
  if (position.contourCode === "FULL_WIDTH") return 2;
  
  // Fallback: Check ULD types for legacy support
  const fullWidthTypes = ["PMC", "PAG", "PLA", "PAJ", "P1P", "P6P"];
  if (position.compatibleUldTypes?.some(t => fullWidthTypes.includes(t))) {
    return 2;
  }
  
  const halfWidthTypes = ["AKE", "DPE", "AKC", "AKH", "ALF", "AVE"];
  if (position.compatibleUldTypes?.some(t => halfWidthTypes.includes(t))) {
    return 1;
  }
  
  // Default to 2 for unknown
  return 2;
}

function DeckVisualization({
  deck,
  isMainDeck,
  selectedPosition,
  onPositionClick,
  positionStatus = {},
  showWeights,
}: {
  deck: DeckConfiguration;
  isMainDeck: boolean;
  selectedPosition?: string | null;
  onPositionClick?: (position: LoadingPosition, deck: DeckConfiguration) => void;
  positionStatus?: Record<string, { status: "empty" | "loaded" | "selected"; weight?: number }>;
  showWeights?: boolean;
}) {
  // Sort positions by sequence
  const sortedPositions = useMemo(
    () => [...deck.positions].sort((a, b) => a.sequenceNumber - b.sequenceNumber),
    [deck.positions]
  );

  // Calculate grid for lower decks
  const maxCol = Math.max(...sortedPositions.map((p) => p.colIndex ?? 0), 0);
  const maxRow = Math.max(...sortedPositions.map((p) => p.rowIndex ?? 0), 0);

  const grid: (LoadingPosition | null)[][] = [];
  for (let row = 0; row <= maxRow; row++) {
    grid[row] = [];
    for (let col = 0; col <= maxCol; col++) {
      const pos = sortedPositions.find((p) => p.colIndex === col && p.rowIndex === row);
      grid[row][col] = pos || null;
    }
  }

  const getDeckColor = (code: string) => {
    if (code.includes("MAIN")) return "from-blue-600/20 to-blue-600/5";
    if (code.includes("FWD")) return "from-blue-500/20 to-blue-500/5";
    if (code.includes("AFT")) return "from-emerald-500/20 to-emerald-500/5";
    if (code.includes("BULK")) return "from-purple-500/20 to-purple-500/5";
    return "from-muted/40 to-muted/10";
  };

  const getDeckBorderColor = (code: string) => {
    if (code.includes("MAIN")) return "border-blue-600/30";
    if (code.includes("FWD")) return "border-blue-500/30";
    if (code.includes("AFT")) return "border-emerald-500/30";
    if (code.includes("BULK")) return "border-purple-500/30";
    return "border-border";
  };

  return (
    <div
      className={cn(
        "rounded-sm border bg-gradient-to-b p-4",
        getDeckColor(deck.deckCode),
        getDeckBorderColor(deck.deckCode)
      )}
    >
      {/* Deck Header */}
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">{deck.deckName}</h3>
          <p className="text-xs text-muted-foreground">
            {deck.positions.length} positions
            {deck.maxStructuralWeightKg && (
              <> • Max {Number(deck.maxStructuralWeightKg).toLocaleString()} kg</>
            )}
          </p>
        </div>
        <span className="rounded-sm bg-background/50 px-2 py-0.5 text-xs font-mono">
          {deck.deckCode}
        </span>
      </div>

      {/* Positions Grid */}
      {isMainDeck ? (
        // Main deck - 2-column grid layout with spanning
        <div className="overflow-x-auto pb-2">
          <div className="grid grid-cols-2 gap-2" style={{ minWidth: "fit-content" }}>
            {sortedPositions.map((position, index) => {
              const colSpan = getColumnSpan(position, index === 0);
              return (
                <div
                  key={position.id}
                  className={colSpan === 2 ? "col-span-2" : "col-span-1"}
                >
                  <PositionCell
                    position={position}
                    deck={deck}
                    isSelected={selectedPosition === position.id}
                    status={positionStatus[position.id]?.status || "empty"}
                    weight={positionStatus[position.id]?.weight}
                    onClick={onPositionClick}
                    showWeight={showWeights}
                    isMainDeck={true}
                    colSpan={colSpan}
                  />
                </div>
              );
            })}
          </div>
          {/* Legend */}
          <div className="mt-3 flex items-center gap-4 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <div className="h-2 w-4 rounded-sm border border-border bg-background/50" />
              Full Width (2 cols)
            </span>
            <span className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-sm border border-border bg-background/50" />
              Half Width (1 col)
            </span>
          </div>
        </div>
      ) : (
        // Lower deck - grid layout
        <div className="flex justify-center">
          <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${maxCol + 1}, 1fr)` }}>
            {grid.map((row, rowIdx) =>
              row.map((position, colIdx) =>
                position ? (
                  <PositionCell
                    key={position.id}
                    position={position}
                    deck={deck}
                    isSelected={selectedPosition === position.id}
                    status={positionStatus[position.id]?.status || "empty"}
                    weight={positionStatus[position.id]?.weight}
                    onClick={onPositionClick}
                    showWeight={showWeights}
                    isMainDeck={false}
                    colSpan={1}
                  />
                ) : (
                  <div key={`empty-${rowIdx}-${colIdx}`} className="h-16 w-full" />
                )
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PositionCell({
  position,
  deck,
  isSelected,
  status,
  weight,
  onClick,
  showWeight,
  isMainDeck,
  colSpan = 1,
}: {
  position: LoadingPosition;
  deck: DeckConfiguration;
  isSelected: boolean;
  status: "empty" | "loaded" | "selected";
  weight?: number;
  onClick?: (position: LoadingPosition, deck: DeckConfiguration) => void;
  showWeight?: boolean;
  isMainDeck: boolean;
  colSpan?: 1 | 2;
}) {
  const getStatusStyles = () => {
    if (isSelected) {
      return "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background";
    }
    switch (status) {
      case "loaded":
        return "bg-emerald-500/20 border-emerald-500/50 text-emerald-500";
      case "selected":
        return "bg-primary/20 border-primary text-primary";
      default:
        return "bg-background/80 border-border hover:border-primary/50 hover:bg-primary/5";
    }
  };

  const getContourIndicator = () => {
    if (!position.contourCode) return null;
    if (position.contourCode === "FULL_WIDTH") {
      return <span className="text-[8px] text-muted-foreground">■■</span>;
    }
    if (position.contourCode === "ONE_COLUMN") {
      return <span className="text-[8px] text-muted-foreground">■</span>;
    }
    return null;
  };

  // Determine cell width based on colSpan for main deck
  const getCellWidth = () => {
    if (!isMainDeck) return "w-full min-w-[4rem]";
    if (colSpan === 2) return "w-full"; // Full width of container
    return "w-full"; // Each cell takes full width of its grid cell
  };

  return (
    <button
      onClick={() => onClick?.(position, deck)}
      className={cn(
        "relative flex flex-col items-center justify-center rounded-sm border transition-all",
        isMainDeck ? "h-20 px-3" : "h-16",
        getCellWidth(),
        getStatusStyles(),
        onClick && "cursor-pointer"
      )}
    >
      {/* Position Code */}
      <span className={cn("font-bold", isMainDeck && colSpan === 2 ? "text-base" : "text-sm")}>
        {position.positionCode}
      </span>

      {/* Weight Info */}
      {showWeight && weight !== undefined ? (
        <span className="text-[10px] font-mono text-emerald-500">{weight.toLocaleString()} kg</span>
      ) : (
        <span className="text-[10px] text-muted-foreground">
          {Number(position.maxWeightKg).toLocaleString()} kg
        </span>
      )}

      {/* ULD Type indicator */}
      {position.acceptsBulkCargo ? (
        <span className="text-[8px] text-purple-400">BULK</span>
      ) : position.compatibleUldTypes && position.compatibleUldTypes.length > 0 ? (
        <span className="text-[8px] text-muted-foreground">
          {position.compatibleUldTypes.slice(0, 2).join("/")}
        </span>
      ) : null}

      {/* Contour/Span indicator */}
      <div className="absolute right-1 top-1 flex items-center gap-0.5">
        {isMainDeck && (
          <span className={cn(
            "text-[8px]",
            colSpan === 2 ? "text-blue-400" : "text-blue-400"
          )}>
            {colSpan === 2 ? "2C" : "1C"}
          </span>
        )}
        {getContourIndicator()}
      </div>

      {/* Loaded indicator */}
      {status === "loaded" && (
        <div className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-emerald-500" />
      )}
    </button>
  );
}

// Compact version for smaller spaces
export function AircraftVisualizationCompact({
  aircraft,
  positionStatus = {},
}: {
  aircraft: Aircraft;
  positionStatus?: Record<string, { status: "empty" | "loaded" | "selected"; weight?: number }>;
}) {
  const sortedDecks = useMemo(
    () => [...aircraft.decks].sort((a, b) => a.sequence - b.sequence),
    [aircraft.decks]
  );

  const getPositionColor = (status?: "empty" | "loaded" | "selected") => {
    switch (status) {
      case "loaded":
        return "bg-emerald-500";
      case "selected":
        return "bg-primary";
      default:
        return "bg-muted-foreground/30";
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {sortedDecks.map((deck) => (
        <div key={deck.id} className="flex items-center gap-2">
          <span className="w-16 text-xs text-muted-foreground truncate">{deck.deckCode}</span>
          <div className="flex gap-1">
            {[...deck.positions]
              .sort((a, b) => a.sequenceNumber - b.sequenceNumber)
              .map((pos) => (
                <div
                  key={pos.id}
                  className={cn(
                    "h-4 w-4 rounded-sm",
                    getPositionColor(positionStatus[pos.id]?.status)
                  )}
                  title={`${pos.positionCode}: ${Number(pos.maxWeightKg).toLocaleString()} kg`}
                />
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

