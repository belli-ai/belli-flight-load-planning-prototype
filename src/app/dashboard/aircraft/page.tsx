"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plane,
  Layers,
  MapPin,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Weight,
  LayoutGrid,
  List,
  Eye,
} from "lucide-react";
import { AircraftVisualization } from "@/components/aircraft/AircraftVisualization";

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

interface Preset {
  id: string;
  aircraftId: string;
  presetName: string;
  presetCode: string;
  description: string | null;
  isDefault: boolean;
  isActive?: boolean;
}

interface Aircraft {
  id: string;
  name: string;
  typeCode: string;
  subtype: string | null;
  registration: string | null;
  mainDeckMaxWeightKg: string;
  lowerDeckMaxWeightKg: string;
  totalMaxPayloadKg: string;
  maxZeroFuelWeightKg: string;
  maxTakeoffWeightKg: string;
  maxLandingWeightKg: string;
  operatingEmptyWeightKg: string;
  presets: Preset[];
  activePreset: Preset | null;
  decks: DeckConfiguration[];
  deckCount: number;
  totalPositions: number;
}

export default function AircraftPage() {
  const [aircrafts, setAircrafts] = useState<Aircraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedAircraft, setExpandedAircraft] = useState<string | null>(null);
  const [expandedDeck, setExpandedDeck] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "visual">("visual");
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);

  // Dialog states
  const [isDeckDialogOpen, setIsDeckDialogOpen] = useState(false);
  const [isPositionDialogOpen, setIsPositionDialogOpen] = useState(false);
  const [editingDeck, setEditingDeck] = useState<DeckConfiguration | null>(null);
  const [editingPosition, setEditingPosition] = useState<LoadingPosition | null>(null);
  const [selectedAircraftId, setSelectedAircraftId] = useState<string | null>(null);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);

  // Form states
  const [deckForm, setDeckForm] = useState({
    deckCode: "",
    deckName: "",
    maxStructuralWeightKg: "",
    sequence: 1,
  });

  const [positionForm, setPositionForm] = useState({
    positionCode: "",
    sequenceNumber: 1,
    maxWeightKg: "",
    armStationCm: "",
    compatibleUldTypes: "",
    acceptsBulkCargo: false,
    maxHeightCm: "",
    contourCode: "",
  });

  const fetchAircrafts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/aircrafts?includeDecks=true");
      const data = await response.json();
      if (data.success) {
        setAircrafts(data.data);
      } else {
        setError(data.error || "Failed to fetch aircrafts");
      }
    } catch (err) {
      setError("Failed to fetch aircrafts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAircrafts();
  }, []);

  const toggleAircraft = (id: string) => {
    setExpandedAircraft(expandedAircraft === id ? null : id);
    setExpandedDeck(null);
  };

  const toggleDeck = (id: string) => {
    setExpandedDeck(expandedDeck === id ? null : id);
  };

  // Deck CRUD operations
  const openAddDeck = (aircraftId: string) => {
    setSelectedAircraftId(aircraftId);
    setEditingDeck(null);
    setDeckForm({
      deckCode: "",
      deckName: "",
      maxStructuralWeightKg: "",
      sequence: 1,
    });
    setIsDeckDialogOpen(true);
  };

  const openEditDeck = (deck: DeckConfiguration, aircraftId?: string) => {
    setSelectedAircraftId(aircraftId || deck.aircraftId || null);
    setEditingDeck(deck);
    setDeckForm({
      deckCode: deck.deckCode,
      deckName: deck.deckName,
      maxStructuralWeightKg: deck.maxStructuralWeightKg || "",
      sequence: deck.sequence,
    });
    setIsDeckDialogOpen(true);
  };

  const saveDeck = async () => {
    if (!selectedAircraftId) return;

    try {
      const url = editingDeck
        ? `/api/aircrafts/${selectedAircraftId}/deck-configurations/${editingDeck.id}`
        : `/api/aircrafts/${selectedAircraftId}/deck-configurations`;

      const response = await fetch(url, {
        method: editingDeck ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(deckForm),
      });

      const data = await response.json();
      if (data.success) {
        setIsDeckDialogOpen(false);
        fetchAircrafts();
      } else {
        alert(data.error || "Failed to save deck configuration");
      }
    } catch (err) {
      alert("Failed to save deck configuration");
    }
  };

  const deleteDeck = async (aircraftId: string, deckId: string) => {
    if (!confirm("Are you sure you want to delete this deck configuration? All positions will be deleted.")) {
      return;
    }

    try {
      const response = await fetch(
        `/api/aircrafts/${aircraftId}/deck-configurations/${deckId}`,
        { method: "DELETE" }
      );

      const data = await response.json();
      if (data.success) {
        fetchAircrafts();
      } else {
        alert(data.error || "Failed to delete deck configuration");
      }
    } catch (err) {
      alert("Failed to delete deck configuration");
    }
  };

  // Position CRUD operations
  const openAddPosition = (aircraftId: string, deckId: string) => {
    setSelectedAircraftId(aircraftId);
    setSelectedDeckId(deckId);
    setEditingPosition(null);
    setPositionForm({
      positionCode: "",
      sequenceNumber: 1,
      maxWeightKg: "",
      armStationCm: "",
      compatibleUldTypes: "",
      acceptsBulkCargo: false,
      maxHeightCm: "",
      contourCode: "",
    });
    setIsPositionDialogOpen(true);
  };

  const openEditPosition = (aircraftId: string, position: LoadingPosition) => {
    setSelectedAircraftId(aircraftId);
    setSelectedDeckId(position.deckId);
    setEditingPosition(position);
    setPositionForm({
      positionCode: position.positionCode,
      sequenceNumber: position.sequenceNumber,
      maxWeightKg: position.maxWeightKg,
      armStationCm: position.armStationCm,
      compatibleUldTypes: position.compatibleUldTypes?.join(", ") || "",
      acceptsBulkCargo: position.acceptsBulkCargo,
      maxHeightCm: position.maxHeightCm || "",
      contourCode: position.contourCode || "",
    });
    setIsPositionDialogOpen(true);
  };

  const savePosition = async () => {
    if (!selectedAircraftId || !selectedDeckId) return;

    try {
      const url = editingPosition
        ? `/api/aircrafts/${selectedAircraftId}/deck-configurations/${selectedDeckId}/positions/${editingPosition.id}`
        : `/api/aircrafts/${selectedAircraftId}/deck-configurations/${selectedDeckId}/positions`;

      const payload = {
        ...positionForm,
        compatibleUldTypes: positionForm.compatibleUldTypes
          ? positionForm.compatibleUldTypes.split(",").map((s) => s.trim())
          : [],
      };

      const response = await fetch(url, {
        method: editingPosition ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        setIsPositionDialogOpen(false);
        fetchAircrafts();
      } else {
        alert(data.error || "Failed to save loading position");
      }
    } catch (err) {
      alert("Failed to save loading position");
    }
  };

  const deletePosition = async (aircraftId: string, deckId: string, positionId: string) => {
    if (!confirm("Are you sure you want to delete this loading position?")) {
      return;
    }

    try {
      const response = await fetch(
        `/api/aircrafts/${aircraftId}/deck-configurations/${deckId}/positions/${positionId}`,
        { method: "DELETE" }
      );

      const data = await response.json();
      if (data.success) {
        fetchAircrafts();
      } else {
        alert(data.error || "Failed to delete loading position");
      }
    } catch (err) {
      alert("Failed to delete loading position");
    }
  };

  const createPositionClickHandler = (aircraftId: string) => 
    (position: LoadingPosition, deck: DeckConfiguration) => {
      setSelectedPosition(position.id);
      openEditPosition(aircraftId, position);
    };

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Aircraft Config</h1>
          <p className="text-sm text-muted-foreground">
            Manage aircraft types, deck configurations, and loading positions
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex rounded-sm border border-border">
            <Button
              variant={viewMode === "visual" ? "default" : "ghost"}
              size="sm"
              className="rounded-r-none"
              onClick={() => setViewMode("visual")}
            >
              <LayoutGrid className="mr-1 size-4" />
              Visual
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              className="rounded-l-none"
              onClick={() => setViewMode("list")}
            >
              <List className="mr-1 size-4" />
              List
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={fetchAircrafts} disabled={loading}>
            <RefreshCw className={`mr-2 size-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-sm border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading && aircrafts.length === 0 ? (
        <Card>
          <CardContent className="flex h-64 items-center justify-center">
            <div className="flex items-center gap-2 text-muted-foreground">
              <RefreshCw className="size-4 animate-spin" />
              Loading aircraft configurations...
            </div>
          </CardContent>
        </Card>
      ) : aircrafts.length === 0 ? (
        <Card>
          <CardContent className="flex h-64 items-center justify-center">
            <p className="text-sm text-muted-foreground">No aircraft configurations found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {aircrafts.map((aircraft) => (
            <Card key={aircraft.id} className="overflow-hidden">
              <CardHeader
                className="cursor-pointer transition-colors hover:bg-foreground/5"
                onClick={() => toggleAircraft(aircraft.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-primary/10 text-primary">
                      <Plane className="size-6" />
                    </div>
                    <div>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        {aircraft.name}
                        <span className="text-sm font-normal text-muted-foreground">
                          ({aircraft.typeCode})
                        </span>
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4 text-xs">
                        <span className="flex items-center gap-1">
                          <Layers className="size-3" />
                          {aircraft.deckCount} decks
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="size-3" />
                          {aircraft.totalPositions} positions
                        </span>
                        <span className="flex items-center gap-1">
                          <Weight className="size-3" />
                          Max Payload: {Number(aircraft.totalMaxPayloadKg).toLocaleString()} kg
                        </span>
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {expandedAircraft === aircraft.id ? (
                      <ChevronDown className="size-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="size-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CardHeader>

              {expandedAircraft === aircraft.id && (
                <CardContent className="border-t bg-background/50 pt-4">
                  {/* Aircraft Weight Limits */}
                  <div className="mb-6 grid grid-cols-2 gap-4 rounded-sm border border-border bg-muted/30 p-4 md:grid-cols-4">
                    <div>
                      <p className="text-xs text-muted-foreground">OEW</p>
                      <p className="font-medium">
                        {Number(aircraft.operatingEmptyWeightKg).toLocaleString()} kg
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Max ZFW</p>
                      <p className="font-medium">
                        {Number(aircraft.maxZeroFuelWeightKg).toLocaleString()} kg
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Max TOW</p>
                      <p className="font-medium">
                        {Number(aircraft.maxTakeoffWeightKg).toLocaleString()} kg
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Max LDW</p>
                      <p className="font-medium">
                        {Number(aircraft.maxLandingWeightKg).toLocaleString()} kg
                      </p>
                    </div>
                  </div>

                  {/* Visual View */}
                  {viewMode === "visual" && (
                    <div className="mb-6">
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-sm font-semibold flex items-center gap-2">
                          <Eye className="size-4" />
                          Aircraft Layout
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Click on a position to edit it
                        </p>
                      </div>
                      <AircraftVisualization
                        aircraft={aircraft}
                        selectedPosition={selectedPosition}
                        onPositionClick={createPositionClickHandler(aircraft.id)}
                        showWeights={true}
                      />
                    </div>
                  )}

                  {/* Deck Configurations (List View) */}
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-semibold">
                      {viewMode === "list" ? "Deck Configurations" : "Deck Management"}
                    </h3>
                    <Button size="sm" variant="outline" onClick={() => openAddDeck(aircraft.id)}>
                      <Plus className="mr-1 size-3" />
                      Add Deck
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {aircraft.decks.map((deck) => (
                      <div
                        key={deck.id}
                        className="rounded-sm border border-border bg-card"
                      >
                        <div
                          className="flex cursor-pointer items-center justify-between p-3 transition-colors hover:bg-foreground/5"
                          onClick={() => toggleDeck(deck.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-muted text-muted-foreground">
                              <Layers className="size-4" />
                            </div>
                            <div>
                              <p className="font-medium">{deck.deckName}</p>
                              <p className="text-xs text-muted-foreground">
                                {deck.deckCode} • {deck.positionCount} positions
                                {deck.maxStructuralWeightKg && (
                                  <> • Max: {Number(deck.maxStructuralWeightKg).toLocaleString()} kg</>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditDeck(deck, aircraft.id);
                              }}
                            >
                              <Pencil className="size-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteDeck(aircraft.id, deck.id);
                              }}
                            >
                              <Trash2 className="size-3" />
                            </Button>
                            {expandedDeck === deck.id ? (
                              <ChevronDown className="size-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="size-4 text-muted-foreground" />
                            )}
                          </div>
                        </div>

                        {expandedDeck === deck.id && (
                          <div className="border-t border-border p-3">
                            <div className="mb-3 flex items-center justify-between">
                              <h4 className="text-xs font-semibold text-muted-foreground uppercase">
                                Loading Positions
                              </h4>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openAddPosition(aircraft.id, deck.id)}
                              >
                                <Plus className="mr-1 size-3" />
                                Add Position
                              </Button>
                            </div>

                            {deck.positions.length === 0 ? (
                              <p className="py-4 text-center text-sm text-muted-foreground">
                                No positions configured
                              </p>
                            ) : (
                              <div className="overflow-x-auto">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead className="w-20">Code</TableHead>
                                      <TableHead className="w-16">Seq</TableHead>
                                      <TableHead className="w-28">Max Weight</TableHead>
                                      <TableHead className="w-28">Arm Station</TableHead>
                                      <TableHead>ULD Types</TableHead>
                                      <TableHead className="w-20">Bulk</TableHead>
                                      <TableHead className="w-20 text-right">Actions</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {deck.positions.map((position) => (
                                      <TableRow key={position.id}>
                                        <TableCell className="font-medium">
                                          {position.positionCode}
                                        </TableCell>
                                        <TableCell>{position.sequenceNumber}</TableCell>
                                        <TableCell>
                                          {Number(position.maxWeightKg).toLocaleString()} kg
                                        </TableCell>
                                        <TableCell>
                                          {Number(position.armStationCm).toLocaleString()} cm
                                        </TableCell>
                                        <TableCell className="text-xs">
                                          {position.compatibleUldTypes?.join(", ") || "-"}
                                        </TableCell>
                                        <TableCell>
                                          {position.acceptsBulkCargo ? (
                                            <span className="rounded-sm bg-primary/10 px-2 py-0.5 text-xs text-primary">
                                              Yes
                                            </span>
                                          ) : (
                                            <span className="text-xs text-muted-foreground">No</span>
                                          )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                          <div className="flex justify-end gap-1">
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={() => openEditPosition(aircraft.id, position)}
                                            >
                                              <Pencil className="size-3" />
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="text-destructive hover:text-destructive"
                                              onClick={() =>
                                                deletePosition(aircraft.id, deck.id, position.id)
                                              }
                                            >
                                              <Trash2 className="size-3" />
                                            </Button>
                                          </div>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}

                    {aircraft.decks.length === 0 && (
                      <p className="py-8 text-center text-sm text-muted-foreground">
                        No deck configurations found. Click &quot;Add Deck&quot; to create one.
                      </p>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Deck Configuration Dialog */}
      <Dialog open={isDeckDialogOpen} onOpenChange={setIsDeckDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingDeck ? "Edit Deck Configuration" : "Add Deck Configuration"}
            </DialogTitle>
            <DialogDescription>
              Configure the deck properties for cargo loading
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deckCode">Deck Code</Label>
                <Input
                  id="deckCode"
                  placeholder="e.g., MAIN, LOWER_FWD"
                  value={deckForm.deckCode}
                  onChange={(e) => setDeckForm({ ...deckForm, deckCode: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deckName">Deck Name</Label>
                <Input
                  id="deckName"
                  placeholder="e.g., Main Deck"
                  value={deckForm.deckName}
                  onChange={(e) => setDeckForm({ ...deckForm, deckName: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxWeight">Max Structural Weight (kg)</Label>
                <Input
                  id="maxWeight"
                  type="number"
                  placeholder="e.g., 27500"
                  value={deckForm.maxStructuralWeightKg}
                  onChange={(e) =>
                    setDeckForm({ ...deckForm, maxStructuralWeightKg: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sequence">Sequence</Label>
                <Input
                  id="sequence"
                  type="number"
                  value={deckForm.sequence}
                  onChange={(e) =>
                    setDeckForm({ ...deckForm, sequence: parseInt(e.target.value) || 1 })
                  }
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDeckDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveDeck}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Loading Position Dialog */}
      <Dialog open={isPositionDialogOpen} onOpenChange={(open) => {
        setIsPositionDialogOpen(open);
        if (!open) {
          setSelectedPosition(null); // Clear highlight when dialog closes
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingPosition ? "Edit Loading Position" : "Add Loading Position"}
            </DialogTitle>
            <DialogDescription>
              Configure the loading position properties
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="positionCode">Position Code</Label>
                <Input
                  id="positionCode"
                  placeholder="e.g., U1, 11"
                  value={positionForm.positionCode}
                  onChange={(e) =>
                    setPositionForm({ ...positionForm, positionCode: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sequenceNumber">Sequence</Label>
                <Input
                  id="sequenceNumber"
                  type="number"
                  value={positionForm.sequenceNumber}
                  onChange={(e) =>
                    setPositionForm({
                      ...positionForm,
                      sequenceNumber: parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxWeightKg">Max Weight (kg)</Label>
                <Input
                  id="maxWeightKg"
                  type="number"
                  placeholder="e.g., 1836"
                  value={positionForm.maxWeightKg}
                  onChange={(e) =>
                    setPositionForm({ ...positionForm, maxWeightKg: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="armStationCm">Arm Station (cm)</Label>
                <Input
                  id="armStationCm"
                  type="number"
                  placeholder="e.g., 500"
                  value={positionForm.armStationCm}
                  onChange={(e) =>
                    setPositionForm({ ...positionForm, armStationCm: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="compatibleUldTypes">Compatible ULD Types (comma-separated)</Label>
              <Input
                id="compatibleUldTypes"
                placeholder="e.g., PMC, PAG, AKE"
                value={positionForm.compatibleUldTypes}
                onChange={(e) =>
                  setPositionForm({ ...positionForm, compatibleUldTypes: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxHeightCm">Max Height (cm)</Label>
                <Input
                  id="maxHeightCm"
                  type="number"
                  placeholder="e.g., 160"
                  value={positionForm.maxHeightCm}
                  onChange={(e) =>
                    setPositionForm({ ...positionForm, maxHeightCm: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contourCode">Contour Code</Label>
                <select
                  id="contourCode"
                  className="flex h-9 w-full rounded-sm border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={positionForm.contourCode}
                  onChange={(e) =>
                    setPositionForm({ ...positionForm, contourCode: e.target.value })
                  }
                >
                  <option value="FULL_WIDTH">FULL_WIDTH (2 columns)</option>
                  <option value="ONE_COLUMN">ONE_COLUMN (1 column)</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="acceptsBulkCargo"
                checked={positionForm.acceptsBulkCargo}
                onChange={(e) =>
                  setPositionForm({ ...positionForm, acceptsBulkCargo: e.target.checked })
                }
                className="h-4 w-4 rounded border-border"
              />
              <Label htmlFor="acceptsBulkCargo" className="text-sm font-normal">
                Accepts bulk cargo (loose cargo without ULD)
              </Label>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsPositionDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={savePosition}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
