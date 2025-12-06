"use client";

import { useState, useEffect, createContext, useContext, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Plane, Search, Clock, MapPin, ChevronDown } from "lucide-react";
import { MOCK_FLIGHTS } from "@/features/planning/data/mock-data";

// ============================================================================
// TYPES
// ============================================================================

export type SelectedFlight = {
  id: string;
  flightNumber: string;
  scheduledDeparture: Date;
  status: string;
  originCode: string;
  destinationCode: string;
  aircraftType: string;
};

type FlightContextType = {
  selectedFlight: SelectedFlight | null;
  setSelectedFlight: (flight: SelectedFlight | null) => void;
  isLoading: boolean;
};

// ============================================================================
// CONTEXT
// ============================================================================

const FlightContext = createContext<FlightContextType | undefined>(undefined);

export function FlightProvider({ children }: { children: React.ReactNode }) {
  const [selectedFlight, setSelectedFlight] = useState<SelectedFlight | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Auto-select first flight for demo
  useEffect(() => {
    if (!selectedFlight && MOCK_FLIGHTS.length > 0) {
      setSelectedFlight(MOCK_FLIGHTS[0]);
    }
  }, [selectedFlight]);

  return (
    <FlightContext.Provider value={{ selectedFlight, setSelectedFlight, isLoading }}>
      {children}
    </FlightContext.Provider>
  );
}

export function useSelectedFlight() {
  const context = useContext(FlightContext);
  if (context === undefined) {
    throw new Error("useSelectedFlight must be used within a FlightProvider");
  }
  return context;
}

// ============================================================================
// FLIGHT SELECTOR COMPONENT
// ============================================================================

type FlightSelectorProps = {
  className?: string;
  variant?: "default" | "compact";
};

export function FlightSelector({ className, variant = "default" }: FlightSelectorProps) {
  const { selectedFlight, setSelectedFlight } = useSelectedFlight();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFlights = MOCK_FLIGHTS.filter(
    (flight) =>
      flight.flightNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flight.originCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flight.destinationCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectFlight = useCallback(
    (flight: SelectedFlight) => {
      setSelectedFlight(flight);
      setOpen(false);
      setSearchQuery("");
    },
    [setSelectedFlight]
  );

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(date);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return "bg-blue-500/20 text-blue-400";
      case "BOARDING":
        return "bg-amber-500/20 text-amber-400";
      case "DEPARTED":
        return "bg-green-500/20 text-green-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-between gap-2 border-border bg-card hover:bg-card/80",
            variant === "compact" ? "h-9 px-3" : "h-11 px-4",
            className
          )}
        >
          {selectedFlight ? (
            <div className="flex items-center gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-primary/10">
                <Plane className="size-3.5 text-primary" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium">
                  {selectedFlight.flightNumber}
                </span>
                <span className="text-xs text-muted-foreground">
                  {selectedFlight.originCode} → {selectedFlight.destinationCode}
                </span>
              </div>
            </div>
          ) : (
            <span className="text-muted-foreground">Select flight...</span>
          )}
          <ChevronDown className="size-4 text-muted-foreground" />
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md p-0">
        <DialogHeader className="border-b border-border px-4 py-3">
          <DialogTitle className="text-base">Select Flight</DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="border-b border-border px-4 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by flight number or route..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Flight List */}
        <div className="max-h-80 overflow-y-auto p-2">
          {filteredFlights.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Plane className="mb-2 size-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No flights found</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredFlights.map((flight) => (
                <button
                  key={flight.id}
                  onClick={() => handleSelectFlight(flight)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-sm p-3 text-left transition-colors",
                    "hover:bg-foreground/5",
                    selectedFlight?.id === flight.id && "bg-primary/10"
                  )}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-card border border-border">
                    <Plane className="size-4 text-primary" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{flight.flightNumber}</span>
                      <span
                        className={cn(
                          "rounded-sm px-1.5 py-0.5 text-[10px] font-medium uppercase",
                          getStatusColor(flight.status)
                        )}
                      >
                        {flight.status}
                      </span>
                    </div>

                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="size-3" />
                        {flight.originCode} → {flight.destinationCode}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {formatDate(flight.scheduledDeparture)},{" "}
                        {formatTime(flight.scheduledDeparture)}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-muted-foreground">
                      {flight.aircraftType}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// FLIGHT INFO BADGE - Compact display for headers
// ============================================================================

export function FlightInfoBadge({ className }: { className?: string }) {
  const { selectedFlight } = useSelectedFlight();

  if (!selectedFlight) return null;

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);
  };

  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-sm border border-border bg-card px-4 py-2",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <Plane className="size-4 text-primary" />
        <span className="font-semibold">{selectedFlight.flightNumber}</span>
      </div>

      <div className="h-4 w-px bg-border" />

      <span className="text-sm text-muted-foreground">
        {selectedFlight.originCode} → {selectedFlight.destinationCode}
      </span>

      <div className="h-4 w-px bg-border" />

      <span className="text-sm text-muted-foreground">
        {formatTime(selectedFlight.scheduledDeparture)}
      </span>

      <div className="h-4 w-px bg-border" />

      <span className="text-xs text-muted-foreground">
        {selectedFlight.aircraftType}
      </span>
    </div>
  );
}

