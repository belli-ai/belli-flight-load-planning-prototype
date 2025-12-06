"use client";

import { useRef, useState, Suspense, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Text, Line } from "@react-three/drei";
import * as THREE from "three";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  RotateCcw,
  Layers,
  Plane,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import type { UldAssignmentResult } from "@/features/planning";

// ============================================================================
// TYPES
// ============================================================================

type DeckFocus = "ALL" | "MAIN" | "LOWER";

type AircraftViewer3DProps = {
  assignments: UldAssignmentResult[];
  className?: string;
  onUldSelect?: (uldIndex: number) => void;
  selectedUldIndex?: number;
};

type UldBoxProps = {
  assignment: UldAssignmentResult;
  position: [number, number, number];
  isSelected: boolean;
  isHovered: boolean;
  onHover: () => void;
  onUnhover: () => void;
  onClick: () => void;
  opacity: number;
};

// ============================================================================
// AIRCRAFT DIMENSIONS (A321-211P2F Reference)
// ============================================================================

const AIRCRAFT = {
  fuselageLength: 44.51, // meters
  fuselageWidth: 3.95, // meters
  fuselageHeight: 4.14, // meters
  noseLength: 6.5, // meters
  tailLength: 8, // meters
  mainDeckFloorY: 0.3, // relative to center
  lowerDeckFloorY: -0.8, // relative to center
  wingSpan: 35.8, // meters
  wingChord: 4.5, // meters
  wingPosition: 0.4, // relative position along fuselage (0-1)
  tailHeight: 3.5, // meters
};

// Position grid layout (simplified)
const MAIN_DECK_POSITIONS: { code: string; x: number; z: number }[] = [
  { code: "11L", x: -12, z: -0.5 },
  { code: "11R", x: -12, z: 0.5 },
  { code: "12L", x: -9, z: -0.5 },
  { code: "12R", x: -9, z: 0.5 },
  { code: "21L", x: -6, z: -0.5 },
  { code: "21R", x: -6, z: 0.5 },
  { code: "22L", x: -3, z: -0.5 },
  { code: "22R", x: -3, z: 0.5 },
  { code: "31L", x: 0, z: -0.5 },
  { code: "31R", x: 0, z: 0.5 },
  { code: "32L", x: 3, z: -0.5 },
  { code: "32R", x: 3, z: 0.5 },
  { code: "41L", x: 6, z: -0.5 },
  { code: "41R", x: 6, z: 0.5 },
  { code: "42L", x: 9, z: -0.5 },
  { code: "42R", x: 9, z: 0.5 },
];

const LOWER_DECK_POSITIONS: { code: string; x: number; z: number }[] = [
  { code: "FWD1", x: -10, z: 0 },
  { code: "FWD2", x: -7, z: 0 },
  { code: "AFT1", x: 2, z: 0 },
  { code: "AFT2", x: 5, z: 0 },
  { code: "AFT3", x: 8, z: 0 },
  { code: "BULK", x: 11, z: 0 },
];

// ============================================================================
// ULD BOX COMPONENT
// ============================================================================

function UldBox({
  assignment,
  position,
  isSelected,
  isHovered,
  onHover,
  onUnhover,
  onClick,
  opacity,
}: UldBoxProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Determine ULD size based on type
  const getUldSize = (typeCode: string): [number, number, number] => {
    if (typeCode.startsWith("PMC") || typeCode.startsWith("PAG")) {
      return [2.2, 1.4, 1.4]; // Pallet
    }
    if (typeCode.startsWith("AKE") || typeCode.startsWith("AKC")) {
      return [1.4, 0.9, 1.3]; // LD-3 container
    }
    return [1.8, 1.1, 1.3]; // Default
  };

  const [w, h, d] = getUldSize(assignment.uldTypeCode);

  // Color based on utilization
  const getColor = () => {
    const util = assignment.volumeUtilization;
    if (util > 0.85) return "#22c55e"; // Green - good
    if (util > 0.6) return "#eab308"; // Yellow - medium
    return "#f97316"; // Orange - low
  };

  const baseColor = isSelected ? "#3b82f6" : getColor();
  const edgeColor = isSelected ? "#ffffff" : isHovered ? "#ffffff" : baseColor;

  useFrame(() => {
    if (groupRef.current) {
      const targetScale = isHovered || isSelected ? 1.08 : 1;
      groupRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        0.15
      );
    }
  });

  return (
    <group
      ref={groupRef}
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover();
      }}
      onPointerOut={onUnhover}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {/* Solid fill with transparency */}
      <mesh>
        <boxGeometry args={[w, h, d]} />
        <meshBasicMaterial
          color={baseColor}
          transparent
          opacity={opacity * (isHovered ? 0.5 : 0.35)}
        />
      </mesh>

      {/* Bold edges */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(w, h, d)]} />
        <lineBasicMaterial
          color={edgeColor}
          transparent
          opacity={opacity}
          linewidth={2}
        />
      </lineSegments>

      {/* Position label */}
      <Text
        position={[0, h / 2 + 0.25, 0]}
        fontSize={0.3}
        color={edgeColor}
        anchorX="center"
        anchorY="bottom"
        fillOpacity={opacity}
        fontWeight="bold"
      >
        {assignment.positionCode || "—"}
      </Text>
      
      {/* ULD type label */}
      <Text
        position={[0, -h / 2 - 0.15, 0]}
        fontSize={0.2}
        color="#9ca3af"
        anchorX="center"
        anchorY="top"
        fillOpacity={opacity * 0.8}
      >
        {assignment.uldTypeCode}
      </Text>
    </group>
  );
}

// ============================================================================
// WIREFRAME LINE COMPONENT
// ============================================================================

function WireframeLine({
  points,
  color = "#3b82f6",
  opacity = 1,
  lineWidth = 1.5,
}: {
  points: [number, number, number][];
  color?: string;
  opacity?: number;
  lineWidth?: number;
}) {
  return (
    <Line
      points={points}
      color={color}
      lineWidth={lineWidth}
      transparent
      opacity={opacity}
    />
  );
}

// ============================================================================
// AIRCRAFT WIREFRAME COMPONENT
// ============================================================================

function AircraftWireframe({ opacity = 1 }: { opacity?: number }) {
  const wireColor = "#3b82f6";
  const deckColor = "#22c55e";
  const secondaryColor = "#6366f1";
  
  // Fuselage dimensions
  const fuselageLength = 30;
  const fuselageRadius = 1.8;
  const noseLength = 5;
  const tailLength = 6;
  
  // Generate fuselage cross-sections (circular wireframe)
  const fuselageSections = useMemo(() => {
    const sections: [number, number, number][][] = [];
    const numSections = 12;
    const sectionSpacing = fuselageLength / (numSections - 1);
    
    for (let i = 0; i < numSections; i++) {
      const x = -fuselageLength / 2 + i * sectionSpacing;
      const points: [number, number, number][] = [];
      
      // Taper at nose and tail
      let radius = fuselageRadius;
      const noseStart = -fuselageLength / 2 + noseLength;
      const tailStart = fuselageLength / 2 - tailLength;
      
      if (x < noseStart) {
        const t = (x - (-fuselageLength / 2)) / noseLength;
        radius = fuselageRadius * Math.sqrt(t);
      } else if (x > tailStart) {
        const t = (fuselageLength / 2 - x) / tailLength;
        radius = fuselageRadius * Math.sqrt(t) * 0.8;
      }
      
      // Create circle points
      const segments = 16;
      for (let j = 0; j <= segments; j++) {
        const angle = (j / segments) * Math.PI * 2;
        points.push([x, Math.sin(angle) * radius, Math.cos(angle) * radius]);
      }
      sections.push(points);
    }
    return sections;
  }, []);
  
  // Longitudinal lines along fuselage
  const longitudinalLines = useMemo(() => {
    const lines: [number, number, number][][] = [];
    const numLines = 8;
    
    for (let i = 0; i < numLines; i++) {
      const angle = (i / numLines) * Math.PI * 2;
      const points: [number, number, number][] = [];
      
      for (let x = -fuselageLength / 2; x <= fuselageLength / 2; x += 1) {
        let radius = fuselageRadius;
        const noseStart = -fuselageLength / 2 + noseLength;
        const tailStart = fuselageLength / 2 - tailLength;
        
        if (x < noseStart) {
          const t = (x - (-fuselageLength / 2)) / noseLength;
          radius = fuselageRadius * Math.sqrt(Math.max(0.1, t));
        } else if (x > tailStart) {
          const t = (fuselageLength / 2 - x) / tailLength;
          radius = fuselageRadius * Math.sqrt(Math.max(0.1, t)) * 0.8;
        }
        
        points.push([x, Math.sin(angle) * radius, Math.cos(angle) * radius]);
      }
      lines.push(points);
    }
    return lines;
  }, []);
  
  // Wing outline (swept back toward tail)
  const wingPoints: [number, number, number][] = [
    [-2, -0.2, 0],      // Leading edge root
    [2, -0.2, 8],       // Leading edge tip (swept back)
    [4, -0.2, 7],       // Trailing edge tip
    [1, -0.2, 0],       // Trailing edge root
    [-2, -0.2, 0],      // Close the shape
  ];
  
  const wingPointsRight: [number, number, number][] = wingPoints.map(
    ([x, y, z]) => [x, y, -z]
  );
  
  // Tail outline
  const verticalTailPoints: [number, number, number][] = [
    [12, 0, 0],
    [15, 3.5, 0],
    [14, 3.5, 0],
    [11, 0, 0],
  ];
  
  const horizontalTailPoints: [number, number, number][] = [
    [13, 3, 0],
    [14, 3, 4],
    [15, 3, 4],
    [14.5, 3, 0],
    [15, 3, -4],
    [14, 3, -4],
    [13, 3, 0],
  ];

  return (
    <group>
      {/* Fuselage cross-sections */}
      {fuselageSections.map((points, idx) => (
        <WireframeLine
          key={`section-${idx}`}
          points={points}
          color={wireColor}
          opacity={opacity * 0.6}
          lineWidth={1}
        />
      ))}
      
      {/* Longitudinal lines */}
      {longitudinalLines.map((points, idx) => (
        <WireframeLine
          key={`long-${idx}`}
          points={points}
          color={wireColor}
          opacity={opacity * 0.4}
          lineWidth={1}
        />
      ))}
      
      {/* Wings */}
      <WireframeLine points={wingPoints} color={secondaryColor} opacity={opacity * 0.8} lineWidth={2} />
      <WireframeLine points={wingPointsRight} color={secondaryColor} opacity={opacity * 0.8} lineWidth={2} />
      
      {/* Vertical tail */}
      <WireframeLine points={verticalTailPoints} color={secondaryColor} opacity={opacity * 0.8} lineWidth={2} />
      
      {/* Horizontal tail */}
      <WireframeLine points={horizontalTailPoints} color={secondaryColor} opacity={opacity * 0.7} lineWidth={1.5} />
      
      {/* Main deck floor outline */}
      <WireframeLine
        points={[
          [-13, AIRCRAFT.mainDeckFloorY, -1.4],
          [-13, AIRCRAFT.mainDeckFloorY, 1.4],
          [11, AIRCRAFT.mainDeckFloorY, 1.4],
          [11, AIRCRAFT.mainDeckFloorY, -1.4],
          [-13, AIRCRAFT.mainDeckFloorY, -1.4],
        ]}
        color={deckColor}
        opacity={opacity}
        lineWidth={2}
      />
      
      {/* Main deck label */}
      <Text
        position={[-14, AIRCRAFT.mainDeckFloorY, 0]}
        rotation={[0, Math.PI / 2, 0]}
        fontSize={0.6}
        color={deckColor}
        anchorX="right"
        anchorY="middle"
      >
        MAIN
      </Text>
      
      {/* Lower deck floor outline */}
      <WireframeLine
        points={[
          [-11, AIRCRAFT.lowerDeckFloorY, -1.1],
          [-11, AIRCRAFT.lowerDeckFloorY, 1.1],
          [12, AIRCRAFT.lowerDeckFloorY, 1.1],
          [12, AIRCRAFT.lowerDeckFloorY, -1.1],
          [-11, AIRCRAFT.lowerDeckFloorY, -1.1],
        ]}
        color="#f97316"
        opacity={opacity}
        lineWidth={2}
      />
      
      {/* Lower deck label */}
      <Text
        position={[-12, AIRCRAFT.lowerDeckFloorY, 0]}
        rotation={[0, Math.PI / 2, 0]}
        fontSize={0.5}
        color="#f97316"
        anchorX="right"
        anchorY="middle"
      >
        LOWER
      </Text>
      
      {/* Center line (CG reference) */}
      <WireframeLine
        points={[
          [-15, 0, 0],
          [15, 0, 0],
        ]}
        color="#ef4444"
        opacity={opacity * 0.3}
        lineWidth={1}
      />
      
      {/* Forward/Aft markers */}
      <Text
        position={[-14, -2, 0]}
        rotation={[-Math.PI / 2, 0, Math.PI / 2]}
        fontSize={0.5}
        color="#9ca3af"
        anchorX="center"
        anchorY="middle"
      >
        FWD
      </Text>
      <Text
        position={[13, -2, 0]}
        rotation={[-Math.PI / 2, 0, Math.PI / 2]}
        fontSize={0.5}
        color="#9ca3af"
        anchorX="center"
        anchorY="middle"
      >
        AFT
      </Text>
    </group>
  );
}

// ============================================================================
// POSITION MARKERS
// ============================================================================

function PositionMarkers({
  deck,
  opacity = 1,
}: {
  deck: "MAIN" | "LOWER";
  opacity?: number;
}) {
  const positions = deck === "MAIN" ? MAIN_DECK_POSITIONS : LOWER_DECK_POSITIONS;
  const y = deck === "MAIN" ? AIRCRAFT.mainDeckFloorY + 0.05 : AIRCRAFT.lowerDeckFloorY + 0.05;
  const color = deck === "MAIN" ? "#22c55e" : "#f97316";

  // Create square outline for each position
  const createSquarePoints = (
    cx: number,
    cy: number,
    cz: number,
    size: number
  ): [number, number, number][] => [
    [cx - size / 2, cy, cz - size / 2],
    [cx + size / 2, cy, cz - size / 2],
    [cx + size / 2, cy, cz + size / 2],
    [cx - size / 2, cy, cz + size / 2],
    [cx - size / 2, cy, cz - size / 2],
  ];

  return (
    <group>
      {positions.map((pos) => (
        <group key={pos.code}>
          {/* Position outline - wireframe square */}
          <Line
            points={createSquarePoints(pos.x, y, pos.z, 1.8)}
            color={color}
            lineWidth={1}
            transparent
            opacity={opacity * 0.4}
            dashed
            dashSize={0.15}
            gapSize={0.1}
          />
          {/* Position label */}
          <Text
            position={[pos.x, y + 0.1, pos.z]}
            rotation={[-Math.PI / 2, 0, 0]}
            fontSize={0.35}
            color={color}
            anchorX="center"
            anchorY="middle"
            fillOpacity={opacity * 0.6}
          >
            {pos.code}
          </Text>
        </group>
      ))}
    </group>
  );
}

// ============================================================================
// CAMERA CONTROLLER
// ============================================================================

function CameraController({
  resetTrigger,
  viewAngle,
}: {
  resetTrigger: number;
  viewAngle: "perspective" | "top" | "side" | "front";
}) {
  const { camera } = useThree();

  const targetPositions = {
    perspective: new THREE.Vector3(25, 15, 25),
    top: new THREE.Vector3(0, 35, 0),
    side: new THREE.Vector3(0, 5, 35),
    front: new THREE.Vector3(-35, 5, 0),
  };

  useFrame(() => {
    if (resetTrigger > 0) {
      camera.position.lerp(targetPositions[viewAngle], 0.05);
    }
  });

  return null;
}

// ============================================================================
// SCENE COMPONENT
// ============================================================================

function Scene({
  assignments,
  deckFocus,
  hoveredUld,
  setHoveredUld,
  selectedUld,
  onSelectUld,
  resetTrigger,
  viewAngle,
}: {
  assignments: UldAssignmentResult[];
  deckFocus: DeckFocus;
  hoveredUld: number | null;
  setHoveredUld: (index: number | null) => void;
  selectedUld: number | null;
  onSelectUld: (index: number) => void;
  resetTrigger: number;
  viewAngle: "perspective" | "top" | "side" | "front";
}) {
  // Group assignments by deck
  const mainDeckAssignments = assignments.filter((a) => {
    const pos = a.positionCode;
    return pos && MAIN_DECK_POSITIONS.some((p) => p.code === pos);
  });

  const lowerDeckAssignments = assignments.filter((a) => {
    const pos = a.positionCode;
    return pos && LOWER_DECK_POSITIONS.some((p) => p.code === pos);
  });

  // Calculate opacity based on focus
  const getOpacity = (deck: "MAIN" | "LOWER") => {
    if (deckFocus === "ALL") return 1;
    if (deckFocus === deck) return 1;
    return 0.2;
  };

  // Get position for ULD based on position code
  const getUldPosition = (
    positionCode: string,
    deck: "MAIN" | "LOWER"
  ): [number, number, number] => {
    const positions = deck === "MAIN" ? MAIN_DECK_POSITIONS : LOWER_DECK_POSITIONS;
    const pos = positions.find((p) => p.code === positionCode);
    const y = deck === "MAIN" ? AIRCRAFT.mainDeckFloorY + 0.8 : AIRCRAFT.lowerDeckFloorY + 0.6;
    return pos ? [pos.x, y, pos.z] : [0, y, 0];
  };

  return (
    <>
      <CameraController resetTrigger={resetTrigger} viewAngle={viewAngle} />
      <PerspectiveCamera makeDefault position={[25, 15, 25]} fov={45} />
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={10}
        maxDistance={80}
        target={[0, 0, 0]}
      />

      {/* Lighting - simpler for wireframes */}
      <ambientLight intensity={0.8} />
      <directionalLight position={[10, 20, 10]} intensity={0.5} />

      {/* Aircraft wireframe */}
      <group rotation={[0, Math.PI / 2, 0]}>
        <AircraftWireframe opacity={deckFocus === "ALL" ? 1 : 0.5} />

        {/* Position markers */}
        <PositionMarkers deck="MAIN" opacity={getOpacity("MAIN")} />
        <PositionMarkers deck="LOWER" opacity={getOpacity("LOWER")} />

        {/* Main deck ULDs */}
        {mainDeckAssignments.map((assignment, idx) => {
          const globalIdx = assignments.indexOf(assignment);
          return (
            <UldBox
              key={assignment.uldTypeId + idx}
              assignment={assignment}
              position={getUldPosition(assignment.positionCode || "", "MAIN")}
              isSelected={selectedUld === globalIdx}
              isHovered={hoveredUld === globalIdx}
              onHover={() => setHoveredUld(globalIdx)}
              onUnhover={() => setHoveredUld(null)}
              onClick={() => onSelectUld(globalIdx)}
              opacity={getOpacity("MAIN")}
            />
          );
        })}

        {/* Lower deck ULDs */}
        {lowerDeckAssignments.map((assignment, idx) => {
          const globalIdx = assignments.indexOf(assignment);
          return (
            <UldBox
              key={assignment.uldTypeId + idx}
              assignment={assignment}
              position={getUldPosition(assignment.positionCode || "", "LOWER")}
              isSelected={selectedUld === globalIdx}
              isHovered={hoveredUld === globalIdx}
              onHover={() => setHoveredUld(globalIdx)}
              onUnhover={() => setHoveredUld(null)}
              onClick={() => onSelectUld(globalIdx)}
              opacity={getOpacity("LOWER")}
            />
          );
        })}
      </group>

      {/* Ground grid */}
      <gridHelper
        args={[60, 30, "#1f2937", "#111827"]}
        position={[0, -2.5, 0]}
      />
    </>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AircraftViewer3D({
  assignments,
  className,
  onUldSelect,
  selectedUldIndex,
}: AircraftViewer3DProps) {
  const [hoveredUld, setHoveredUld] = useState<number | null>(null);
  const [deckFocus, setDeckFocus] = useState<DeckFocus>("ALL");
  const [resetTrigger, setResetTrigger] = useState(0);
  const [viewAngle, setViewAngle] = useState<
    "perspective" | "top" | "side" | "front"
  >("perspective");

  const handleResetView = () => {
    setResetTrigger((t) => t + 1);
    setViewAngle("perspective");
  };

  const cycleDeckFocus = () => {
    setDeckFocus((current) => {
      if (current === "ALL") return "MAIN";
      if (current === "MAIN") return "LOWER";
      return "ALL";
    });
  };

  // Get hovered ULD details
  const hoveredAssignment =
    hoveredUld !== null ? assignments[hoveredUld] : null;

  // Calculate deck stats
  const mainDeckCount = assignments.filter((a) =>
    MAIN_DECK_POSITIONS.some((p) => p.code === a.positionCode)
  ).length;
  const lowerDeckCount = assignments.filter((a) =>
    LOWER_DECK_POSITIONS.some((p) => p.code === a.positionCode)
  ).length;

  return (
    <div className={cn("relative", className)}>
      {/* Header bar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Plane className="size-4 text-primary" />
            <span className="font-medium">Aircraft Load View</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>
              Main: <span className="text-foreground font-medium">{mainDeckCount}</span>
            </span>
            <span>•</span>
            <span>
              Lower: <span className="text-foreground font-medium">{lowerDeckCount}</span>
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={cycleDeckFocus}
          >
            {deckFocus === "ALL" && (
              <>
                <Layers className="mr-1 size-3" />
                All Decks
              </>
            )}
            {deckFocus === "MAIN" && (
              <>
                <ArrowUp className="mr-1 size-3" />
                Main Deck
              </>
            )}
            {deckFocus === "LOWER" && (
              <>
                <ArrowDown className="mr-1 size-3" />
                Lower Deck
              </>
            )}
          </Button>
          <div className="h-4 w-px bg-border mx-1" />
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleResetView}
            title="Reset view"
          >
            <RotateCcw className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* 3D Canvas */}
      <div className="relative h-[400px] rounded-sm border border-border bg-[#0a0a0a] overflow-hidden">
        <Canvas shadows>
          <Suspense fallback={null}>
            <Scene
              assignments={assignments}
              deckFocus={deckFocus}
              hoveredUld={hoveredUld}
              setHoveredUld={setHoveredUld}
              selectedUld={selectedUldIndex ?? null}
              onSelectUld={(idx) => onUldSelect?.(idx)}
              resetTrigger={resetTrigger}
              viewAngle={viewAngle}
            />
          </Suspense>
        </Canvas>

        {/* Hover tooltip */}
        {hoveredAssignment && (
          <div className="absolute bottom-3 left-3 right-3 rounded-sm border border-border bg-popover/95 backdrop-blur-sm p-3 shadow-lg">
            <div className="flex items-start gap-3">
              <div
                className="mt-0.5 h-3 w-3 rounded-sm shrink-0"
                style={{
                  backgroundColor:
                    hoveredAssignment.volumeUtilization > 0.85
                      ? "#22c55e"
                      : hoveredAssignment.volumeUtilization > 0.6
                      ? "#eab308"
                      : "#f97316",
                }}
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">
                  {hoveredAssignment.uldTypeCode} @{" "}
                  {hoveredAssignment.positionCode || "Unassigned"}
                </div>
                <div className="mt-1 flex gap-4 text-xs text-muted-foreground">
                  <span>
                    Weight: {hoveredAssignment.totalWeightKg.toLocaleString()} kg
                  </span>
                  <span>
                    Vol: {Math.round(hoveredAssignment.volumeUtilization * 100)}%
                  </span>
                  <span>Items: {hoveredAssignment.cargoItems.length}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Controls hint */}
        <div className="absolute top-2 right-2 text-[10px] text-muted-foreground/50">
          Drag to rotate • Scroll to zoom • Click ULD to select
        </div>

        {/* Deck focus indicator */}
        <div className="absolute top-2 left-2 text-xs px-2 py-1 rounded bg-background/80 border border-border">
          {deckFocus === "ALL" && "Viewing: All Decks"}
          {deckFocus === "MAIN" && "Viewing: Main Deck"}
          {deckFocus === "LOWER" && "Viewing: Lower Deck"}
        </div>
      </div>
    </div>
  );
}

