"use client";

import { useRef, useState, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Environment, Text, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Box,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Maximize2,
  Layers,
} from "lucide-react";
import type { UldAssignmentResult, PackedItemResult } from "../types";
import type { CargoItemDisplay } from "@/features/cargo";
import { getColorForAwb } from "../lib/utils/colors";

// ============================================================================
// TYPES
// ============================================================================

type UldViewer3DProps = {
  assignments: UldAssignmentResult[];
  selectedUldIndex?: number;
  onSelectUld?: (index: number) => void;
  className?: string;
  cargoItems?: CargoItemDisplay[];
};

type PackedItemWithDetails = PackedItemResult & {
  awbNumber: string;
  description: string | null;
  color: string;
  weightKg: number;
};

// ============================================================================
// 3D CARGO BOX COMPONENT
// ============================================================================

function CargoBox({
  position,
  dimensions,
  color,
  awbNumber,
  isHovered,
  onHover,
  onUnhover,
}: {
  position: [number, number, number];
  dimensions: [number, number, number];
  color: string;
  awbNumber: string;
  isHovered: boolean;
  onHover: () => void;
  onUnhover: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Scale factor to fit in view (cm to units)
  const scale = 0.01;
  
  // Center the box on its position
  const [w, h, d] = dimensions.map(dim => dim * scale);
  const [x, y, z] = position.map(pos => pos * scale);
  
  // Animate on hover
  useFrame(() => {
    if (meshRef.current) {
      const targetScale = isHovered ? 1.02 : 1;
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }
  });

  return (
    <group position={[x + w / 2, z + d / 2, y + h / 2]}>
      <RoundedBox
        ref={meshRef}
        args={[w, d, h]}
        radius={0.01}
        smoothness={2}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover();
        }}
        onPointerOut={onUnhover}
      >
        <meshStandardMaterial
          color={color}
          transparent
          opacity={isHovered ? 1 : 0.9}
          roughness={0.3}
          metalness={0.1}
        />
      </RoundedBox>
      
      {/* Edges */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(w, d, h)]} />
        <lineBasicMaterial color={isHovered ? "#ffffff" : color} linewidth={2} />
      </lineSegments>
    </group>
  );
}

// ============================================================================
// ULD CONTAINER COMPONENT
// ============================================================================

function UldContainer({
  dimensions,
  items,
  hoveredItem,
  setHoveredItem,
}: {
  dimensions: { length: number; width: number; height: number };
  items: PackedItemWithDetails[];
  hoveredItem: string | null;
  setHoveredItem: (id: string | null) => void;
}) {
  const scale = 0.01;
  const { length, width, height } = dimensions;
  const w = length * scale;
  const h = width * scale;
  const d = height * scale;

  return (
    <group>
      {/* ULD Base - wireframe outline */}
      <lineSegments position={[w / 2, d / 2, h / 2]}>
        <edgesGeometry args={[new THREE.BoxGeometry(w, d, h)]} />
        <lineBasicMaterial color="#444444" transparent opacity={0.5} />
      </lineSegments>

      {/* ULD Floor */}
      <mesh position={[w / 2, 0.005, h / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial 
          color="#1a1a1a" 
          transparent 
          opacity={0.8}
          roughness={0.8}
        />
      </mesh>

      {/* Grid lines on floor */}
      <gridHelper
        args={[Math.max(w, h), 10, "#333333", "#222222"]}
        position={[w / 2, 0.01, h / 2]}
      />

      {/* Cargo boxes */}
      {items.map((item) => (
        <CargoBox
          key={item.cargoItemId}
          position={[item.position.x, item.position.y, item.position.z]}
          dimensions={[item.dimensions.length, item.dimensions.width, item.dimensions.height]}
          color={item.color}
          awbNumber={item.awbNumber}
          isHovered={hoveredItem === item.cargoItemId}
          onHover={() => setHoveredItem(item.cargoItemId)}
          onUnhover={() => setHoveredItem(null)}
        />
      ))}
    </group>
  );
}

// ============================================================================
// CAMERA CONTROLLER
// ============================================================================

function CameraController({ resetTrigger }: { resetTrigger: number }) {
  const { camera } = useThree();
  
  // Reset camera position when trigger changes
  useFrame(() => {
    if (resetTrigger > 0) {
      camera.position.lerp(new THREE.Vector3(3, 2.5, 3), 0.05);
    }
  });
  
  return null;
}

// ============================================================================
// SCENE COMPONENT
// ============================================================================

function Scene({
  assignment,
  hoveredItem,
  setHoveredItem,
  resetTrigger,
  cargoItems,
}: {
  assignment: UldAssignmentResult;
  hoveredItem: string | null;
  setHoveredItem: (id: string | null) => void;
  resetTrigger: number;
  cargoItems: CargoItemDisplay[];
}) {
  // Get ULD dimensions from the assignment (provided by optimizer)
  const uldDimensions = {
    length: assignment.uldDimensions?.lengthCm || 156,
    width: assignment.uldDimensions?.widthCm || 153,
    height: assignment.uldDimensions?.heightCm || 163,
  };

  // Enrich cargo items with details
  const packedItems: PackedItemWithDetails[] = assignment.cargoItems.map((item) => {
    const cargo = cargoItems.find((c) => c.id === item.cargoItemId);
    return {
      ...item,
      awbNumber: cargo?.awbNumber || "Unknown",
      description: cargo?.description || null,
      color: getColorForAwb(cargo?.awbNumber || ""),
      weightKg: cargo?.weightKg || 0,
    };
  });

  return (
    <>
      <CameraController resetTrigger={resetTrigger} />
      <PerspectiveCamera makeDefault position={[3, 2.5, 3]} fov={50} />
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={1}
        maxDistance={10}
        target={[0.8, 0.5, 0.8]}
      />

      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 5]} intensity={1} castShadow />
      <directionalLight position={[-5, 5, -5]} intensity={0.3} />
      
      {/* Environment for reflections */}
      <Environment preset="city" />

      {/* ULD Container with cargo */}
      <UldContainer
        dimensions={uldDimensions}
        items={packedItems}
        hoveredItem={hoveredItem}
        setHoveredItem={setHoveredItem}
      />
    </>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function UldViewer3D({
  assignments,
  selectedUldIndex = 0,
  onSelectUld,
  className,
  cargoItems = [],
}: UldViewer3DProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [resetTrigger, setResetTrigger] = useState(0);

  const currentAssignment = assignments[selectedUldIndex];

  if (!currentAssignment) {
    return (
      <div className={cn("flex items-center justify-center h-64 rounded-sm border border-dashed border-border", className)}>
        <div className="text-center text-muted-foreground">
          <Box className="mx-auto mb-2 size-10 opacity-50" />
          <p className="text-sm">No ULD assignments to display</p>
        </div>
      </div>
    );
  }

  const handlePrevUld = () => {
    if (selectedUldIndex > 0) {
      onSelectUld?.(selectedUldIndex - 1);
    }
  };

  const handleNextUld = () => {
    if (selectedUldIndex < assignments.length - 1) {
      onSelectUld?.(selectedUldIndex + 1);
    }
  };

  const handleResetView = () => {
    setResetTrigger((t) => t + 1);
  };

  // Get hovered item details
  const hoveredItemDetails = hoveredItem
    ? (() => {
        const cargo = cargoItems.find((c) => c.id === hoveredItem);
        return cargo
          ? {
              awbNumber: cargo.awbNumber,
              description: cargo.description,
              weightKg: cargo.weightKg,
              dimensions: `${cargo.lengthCm}×${cargo.widthCm}×${cargo.heightCm}cm`,
              color: getColorForAwb(cargo.awbNumber),
            }
          : null;
      })()
    : null;

  return (
    <div className={cn("relative", className)}>
      {/* Header bar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Layers className="size-4 text-primary" />
            <span className="font-medium">3D Visualization</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Box className="size-4 text-primary" />
            <span className="font-medium text-foreground">{currentAssignment.uldTypeCode}</span>
            <span>@ {currentAssignment.positionCode || "Unassigned"}</span>
          </div>
        </div>

        {/* ULD Navigation */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handlePrevUld}
            disabled={selectedUldIndex === 0}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-sm text-muted-foreground min-w-[60px] text-center">
            {selectedUldIndex + 1} / {assignments.length}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleNextUld}
            disabled={selectedUldIndex === assignments.length - 1}
          >
            <ChevronRight className="size-4" />
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
      <div className="relative h-[300px] rounded-sm border border-border bg-[#0a0a0a] overflow-hidden">
        <Canvas shadows>
          <Suspense fallback={null}>
            <Scene
              assignment={currentAssignment}
              hoveredItem={hoveredItem}
              setHoveredItem={setHoveredItem}
              resetTrigger={resetTrigger}
              cargoItems={cargoItems}
            />
          </Suspense>
        </Canvas>

        {/* Hover tooltip */}
        {hoveredItemDetails && (
          <div className="absolute bottom-3 left-3 right-3 rounded-sm border border-border bg-popover/95 backdrop-blur-sm p-3 shadow-lg">
            <div className="flex items-start gap-3">
              <div
                className="mt-0.5 h-3 w-3 rounded-sm shrink-0"
                style={{ backgroundColor: hoveredItemDetails.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{hoveredItemDetails.awbNumber}</div>
                <div className="text-xs text-muted-foreground">
                  {hoveredItemDetails.description || "General cargo"}
                </div>
                <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                  <span>{hoveredItemDetails.weightKg} kg</span>
                  <span>{hoveredItemDetails.dimensions}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Controls hint */}
        <div className="absolute top-2 right-2 text-[10px] text-muted-foreground/50">
          Drag to rotate • Scroll to zoom
        </div>
      </div>

      {/* Stats footer */}
      <div className="mt-3 grid grid-cols-3 gap-4 text-center">
        <div className="rounded-sm border border-border bg-card p-2">
          <div className="text-lg font-semibold text-primary">
            {Math.round(currentAssignment.volumeUtilization * 100)}%
          </div>
          <div className="text-[10px] uppercase text-muted-foreground">
            Volume Used
          </div>
        </div>
        <div className="rounded-sm border border-border bg-card p-2">
          <div className="text-lg font-semibold">
            {currentAssignment.totalWeightKg.toLocaleString("en-US")}
          </div>
          <div className="text-[10px] uppercase text-muted-foreground">
            Weight (kg)
          </div>
        </div>
        <div className="rounded-sm border border-border bg-card p-2">
          <div className="text-lg font-semibold">
            {currentAssignment.cargoItems.length}
          </div>
          <div className="text-[10px] uppercase text-muted-foreground">
            Items
          </div>
        </div>
      </div>
    </div>
  );
}

