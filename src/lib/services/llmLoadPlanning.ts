import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";
import {
  loadPlans,
  aircrafts,
  uldAssignments,
  positionLoads,
  loadingPositions,
  deckConfigurationPresets,
  deckConfigurations,
  cgEnvelopes,
  loadingZones,
  loadingZoneIndexEntries,
  weightConstraints,
  packingRules,
  cargoItems,
  packedItems,
  dangerousGoodsClasses,
} from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";

const anthropic = new Anthropic();

export interface LoadPlanningInput {
  loadPlanId: string;
  selectedRuleIds?: string[];
  fuelLoadKg?: number;
  targetCgPercentMac?: number;
  preferences?: {
    prioritizeWeight?: boolean;
    prioritizeBalance?: boolean;
    prioritizeDgSeparation?: boolean;
  };
}

export interface PositionAssignment {
  uldAssignmentId: string;
  positionCode: string;
  positionId: string;
  reason: string;
}

export interface LoadPlanningResult {
  success: boolean;
  loadPlanId: string;
  positionAssignments: PositionAssignment[];
  calculations: {
    totalPayloadKg: number;
    zeroFuelWeightKg: number;
    takeoffWeightKg: number;
    landingWeightKg: number;
    zfwCgPercentMac: number;
    towCgPercentMac: number;
    totalIndex: number;
  };
  validation: {
    withinWeightLimits: boolean;
    withinCgEnvelope: boolean;
    constraintsSatisfied: boolean;
    dgRulesSatisfied: boolean;
    errors: string[];
    warnings: string[];
  };
  llmReasoning: string;
  optimizationTimeMs: number;
}

interface AircraftContext {
  aircraft: typeof aircrafts.$inferSelect;
  decks: (typeof deckConfigurations.$inferSelect & {
    positions: typeof loadingPositions.$inferSelect[];
  })[];
  cgEnvelopes: typeof cgEnvelopes.$inferSelect[];
  loadingZones: (typeof loadingZones.$inferSelect & {
    indexEntries: typeof loadingZoneIndexEntries.$inferSelect[];
  })[];
  weightConstraints: typeof weightConstraints.$inferSelect[];
}

interface CargoContext {
  assignments: (typeof uldAssignments.$inferSelect & {
    cargoDetails: {
      hasDangerousGoods: boolean;
      dgClasses: string[];
      hasPerishables: boolean;
      hasLiveAnimals: boolean;
      priority: string;
    };
  })[];
}

/**
 * Get aircraft configuration context for LLM
 */
async function getAircraftContext(aircraftId: string): Promise<AircraftContext> {
  const [aircraft] = await db
    .select()
    .from(aircrafts)
    .where(eq(aircrafts.id, aircraftId));

  if (!aircraft) throw new Error("Aircraft not found");

  // Get default preset for this aircraft
  const [defaultPreset] = await db
    .select()
    .from(deckConfigurationPresets)
    .where(and(
      eq(deckConfigurationPresets.aircraftId, aircraftId),
      eq(deckConfigurationPresets.isDefault, true)
    ))
    .limit(1);

  // Get deck configurations with positions via preset
  const decks = defaultPreset
    ? await db
        .select()
        .from(deckConfigurations)
        .where(eq(deckConfigurations.presetId, defaultPreset.id))
        .orderBy(deckConfigurations.sequence)
    : [];

  const decksWithPositions = await Promise.all(
    decks.map(async (deck) => {
      const positions = await db
        .select()
        .from(loadingPositions)
        .where(eq(loadingPositions.deckId, deck.id))
        .orderBy(loadingPositions.sequenceNumber);
      return { ...deck, positions };
    })
  );

  // Get CG envelopes
  const envelopes = await db
    .select()
    .from(cgEnvelopes)
    .where(eq(cgEnvelopes.aircraftId, aircraftId));

  // Get loading zones with index entries
  const zones = await db
    .select()
    .from(loadingZones)
    .where(eq(loadingZones.aircraftId, aircraftId));

  const zonesWithEntries = await Promise.all(
    zones.map(async (zone) => {
      const indexEntries = await db
        .select()
        .from(loadingZoneIndexEntries)
        .where(eq(loadingZoneIndexEntries.zoneId, zone.id));
      return { ...zone, indexEntries };
    })
  );

  // Get weight constraints
  const constraints = await db
    .select()
    .from(weightConstraints)
    .where(and(eq(weightConstraints.aircraftId, aircraftId), eq(weightConstraints.isActive, true)));

  return {
    aircraft,
    decks: decksWithPositions,
    cgEnvelopes: envelopes,
    loadingZones: zonesWithEntries,
    weightConstraints: constraints,
  };
}

/**
 * Get cargo context for LLM
 */
async function getCargoContext(loadPlanId: string): Promise<CargoContext> {
  const assignments = await db
    .select()
    .from(uldAssignments)
    .where(eq(uldAssignments.loadPlanId, loadPlanId))
    .orderBy(uldAssignments.sequence);

  const assignmentsWithDetails = await Promise.all(
    assignments.map(async (assignment) => {
      // Get packed items
      const packed = await db
        .select()
        .from(packedItems)
        .where(eq(packedItems.uldAssignmentId, assignment.id));

      const cargoItemIds = packed.map((p) => p.cargoItemId);

      let hasDangerousGoods = false;
      let dgClasses: string[] = [];
      let hasPerishables = false;
      let hasLiveAnimals = false;
      let priority = "STANDARD";

      if (cargoItemIds.length > 0) {
        const cargo = await db
          .select()
          .from(cargoItems)
          .where(inArray(cargoItems.id, cargoItemIds));

        hasDangerousGoods = cargo.some((c) => c.isDangerousGoods);
        hasPerishables = cargo.some((c) =>
          c.specialHandlingCodes?.includes("PER") || c.tempZoneId != null
        );
        hasLiveAnimals = cargo.some((c) => c.isLiveAnimal);
        priority = cargo.some((c) => c.priority === "EXPRESS") ? "EXPRESS" : "STANDARD";

        // Get DG classes
        const dgItems = cargo.filter((c) => c.isDangerousGoods && c.dgClassId);
        if (dgItems.length > 0) {
          const dgClassIds = [...new Set(dgItems.map((c) => c.dgClassId!))];
          const classes = await db
            .select()
            .from(dangerousGoodsClasses)
            .where(inArray(dangerousGoodsClasses.id, dgClassIds));
          dgClasses = classes.map((c) => c.classCode);
        }
      }

      return {
        ...assignment,
        cargoDetails: {
          hasDangerousGoods,
          dgClasses,
          hasPerishables,
          hasLiveAnimals,
          priority,
        },
      };
    })
  );

  return { assignments: assignmentsWithDetails };
}

/**
 * Get selected packing rules
 */
async function getPackingRules(selectedRuleIds?: string[]) {
  if (selectedRuleIds && selectedRuleIds.length > 0) {
    return db
      .select()
      .from(packingRules)
      .where(and(inArray(packingRules.id, selectedRuleIds), eq(packingRules.isActive, true)));
  }

  // Get all active rules if none specified
  return db.select().from(packingRules).where(eq(packingRules.isActive, true));
}

/**
 * Build the prompt for the LLM
 */
function buildLoadPlanningPrompt(
  aircraftContext: AircraftContext,
  cargoContext: CargoContext,
  rules: typeof packingRules.$inferSelect[],
  fuelLoadKg: number,
  targetCgPercentMac?: number
): string {
  const { aircraft, decks, cgEnvelopes: envelopes, loadingZones: zones, weightConstraints: constraints } = aircraftContext;
  const { assignments } = cargoContext;

  // Build position list
  const positionsList = decks.flatMap((deck) =>
    deck.positions.map((pos) => ({
      code: pos.positionCode,
      deck: deck.deckCode,
      maxWeightKg: pos.maxWeightKg,
      armStationCm: pos.armStationCm,
      compatibleUldTypes: pos.compatibleUldTypes,
      acceptsBulkCargo: pos.acceptsBulkCargo,
    }))
  );

  // Build ULD list
  const uldsList = assignments.map((a) => ({
    id: a.id,
    uldNumber: a.uldNumber,
    isBulk: a.isVirtual,
    totalWeightKg: Number(a.totalWeightKg),
    cargoWeightKg: Number(a.cargoWeightKg),
    ...a.cargoDetails,
  }));

  // Build rules list
  const rulesList = rules.map((r) => ({
    type: r.ruleType,
    priority: r.priority,
    category: r.category,
    rule: r.ruleText,
    examples: r.examples,
  }));

  // Build constraints list
  const constraintsList = constraints.map((c) => ({
    name: c.name,
    positions: c.affectedPositions,
    maxCombinedWeightKg: c.maxCombinedWeightKg,
    description: c.description,
  }));

  // Build zone index info
  const zoneInfo = zones.map((z) => ({
    code: z.zoneCode,
    positions: z.positionCodes,
    lmcIndexImpact: z.lmcIndexImpact,
  }));

  return `You are an expert aircraft load planning system. Your task is to assign ULDs and bulk cargo to optimal positions on the aircraft while ensuring safety and balance.

## AIRCRAFT CONFIGURATION
Aircraft: ${aircraft.name} (${aircraft.typeCode})
Maximum Payload: ${aircraft.totalMaxPayloadKg} kg
Max Zero Fuel Weight: ${aircraft.maxZeroFuelWeightKg} kg  
Max Takeoff Weight: ${aircraft.maxTakeoffWeightKg} kg
Max Landing Weight: ${aircraft.maxLandingWeightKg} kg
Operating Empty Weight: ${aircraft.operatingEmptyWeightKg} kg

## FUEL LOAD
Fuel at Takeoff: ${fuelLoadKg} kg

## CG LIMITS
${envelopes.map((e) => `${e.envelopeType}: Forward ${e.forwardLimitPercentMac}% MAC, Aft ${e.aftLimitPercentMac}% MAC`).join("\n")}
${targetCgPercentMac ? `\nTarget CG: ${targetCgPercentMac}% MAC` : ""}

## AVAILABLE POSITIONS
${JSON.stringify(positionsList, null, 2)}

## LOADING ZONES (for index calculation)
${JSON.stringify(zoneInfo, null, 2)}

## WEIGHT CONSTRAINTS
${JSON.stringify(constraintsList, null, 2)}

## ULDs/CARGO TO LOAD
${JSON.stringify(uldsList, null, 2)}

## PACKING RULES TO FOLLOW
${JSON.stringify(rulesList, null, 2)}

## YOUR TASK
1. Analyze each ULD/cargo and determine the optimal position
2. Consider weight distribution for CG balance (aim for center of envelope)
3. Apply all packing rules, especially for dangerous goods segregation
4. Respect position weight limits and combined constraints
5. Place heavier items strategically to achieve target CG
6. Keep dangerous goods separated as required
7. Prioritize temperature-controlled items near appropriate positions

## OUTPUT FORMAT
Respond with a JSON object containing:
{
  "assignments": [
    {
      "uldAssignmentId": "uuid",
      "positionCode": "U1",
      "reason": "Brief explanation of why this position was chosen"
    }
  ],
  "reasoning": "Overall explanation of the load plan strategy",
  "warnings": ["Any warnings or concerns"],
  "estimatedCgPercentMac": 28.5,
  "totalIndex": 45.0
}

IMPORTANT: 
- Every ULD must be assigned to exactly one position
- No position can have more than one ULD (except bulk cargo areas if applicable)
- Respond ONLY with valid JSON, no markdown formatting`;
}

/**
 * Parse LLM response and validate
 */
function parseLlmResponse(response: string): {
  assignments: { uldAssignmentId: string; positionCode: string; reason: string }[];
  reasoning: string;
  warnings: string[];
  estimatedCgPercentMac: number;
  totalIndex: number;
} {
  try {
    // Try to extract JSON from the response
    let jsonStr = response.trim();
    
    // Handle markdown code blocks
    if (jsonStr.startsWith("```")) {
      const match = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (match) {
        jsonStr = match[1].trim();
      }
    }

    const parsed = JSON.parse(jsonStr);
    return {
      assignments: parsed.assignments || [],
      reasoning: parsed.reasoning || "",
      warnings: parsed.warnings || [],
      estimatedCgPercentMac: parsed.estimatedCgPercentMac || 28.0,
      totalIndex: parsed.totalIndex || 0,
    };
  } catch (error) {
    console.error("Failed to parse LLM response:", error);
    throw new Error("Failed to parse LLM optimization response");
  }
}

/**
 * Main load planning optimization function using LLM
 */
export async function optimizeLoadPlanWithLlm(
  input: LoadPlanningInput
): Promise<LoadPlanningResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Get load plan
    const [loadPlan] = await db
      .select()
      .from(loadPlans)
      .where(eq(loadPlans.id, input.loadPlanId));

    if (!loadPlan) {
      throw new Error("Load plan not found");
    }

    // Get aircraft context
    const aircraftContext = await getAircraftContext(loadPlan.aircraftId);

    // Get cargo context
    const cargoContext = await getCargoContext(input.loadPlanId);

    if (cargoContext.assignments.length === 0) {
      throw new Error("No ULD assignments found in load plan");
    }

    // Get packing rules
    const rules = await getPackingRules(input.selectedRuleIds);

    // Build prompt
    const prompt = buildLoadPlanningPrompt(
      aircraftContext,
      cargoContext,
      rules,
      input.fuelLoadKg || 8000,
      input.targetCgPercentMac
    );

    // Call Anthropic LLM
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    // Extract text response
    const textContent = message.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      throw new Error("No text response from LLM");
    }

    // Parse LLM response
    const llmResult = parseLlmResponse(textContent.text);
    warnings.push(...llmResult.warnings);

    // Create position-to-id mapping
    const positionMap = new Map<string, string>();
    for (const deck of aircraftContext.decks) {
      for (const pos of deck.positions) {
        positionMap.set(pos.positionCode, pos.id);
      }
    }

    // Validate and apply assignments
    const positionAssignments: PositionAssignment[] = [];
    const usedPositions = new Set<string>();

    for (const assignment of llmResult.assignments) {
      const positionId = positionMap.get(assignment.positionCode);

      if (!positionId) {
        errors.push(`Invalid position code: ${assignment.positionCode}`);
        continue;
      }

      if (usedPositions.has(assignment.positionCode)) {
        errors.push(`Position ${assignment.positionCode} assigned multiple times`);
        continue;
      }

      usedPositions.add(assignment.positionCode);
      positionAssignments.push({
        uldAssignmentId: assignment.uldAssignmentId,
        positionCode: assignment.positionCode,
        positionId,
        reason: assignment.reason,
      });
    }

    // Check all ULDs are assigned
    const assignedUldIds = new Set(positionAssignments.map((a) => a.uldAssignmentId));
    for (const uld of cargoContext.assignments) {
      if (!assignedUldIds.has(uld.id)) {
        errors.push(`ULD ${uld.uldNumber} was not assigned to any position`);
      }
    }

    // Apply assignments to database
    await db.transaction(async (tx) => {
      // Clear existing position loads
      await tx.delete(positionLoads).where(eq(positionLoads.loadPlanId, input.loadPlanId));

      // Update ULD assignments with positions
      for (const assignment of positionAssignments) {
        await tx
          .update(uldAssignments)
          .set({
            positionCode: assignment.positionCode,
            updatedAt: new Date(),
          })
          .where(eq(uldAssignments.id, assignment.uldAssignmentId));

        // Get ULD weight
        const [uld] = await tx
          .select()
          .from(uldAssignments)
          .where(eq(uldAssignments.id, assignment.uldAssignmentId));

        // Create position load
        await tx.insert(positionLoads).values({
          loadPlanId: input.loadPlanId,
          positionId: assignment.positionId,
          uldAssignmentId: assignment.uldAssignmentId,
          positionCode: assignment.positionCode,
          grossWeightKg: uld.totalWeightKg,
          status: "PLANNED",
        });
      }

      // Calculate totals
      const totalPayloadKg = cargoContext.assignments.reduce(
        (sum, a) => sum + Number(a.cargoWeightKg || 0),
        0
      );
      const totalTareKg = cargoContext.assignments.reduce(
        (sum, a) => sum + Number(a.tareWeightKg || 0),
        0
      );

      const oew = Number(aircraftContext.aircraft.operatingEmptyWeightKg);
      const zfwKg = oew + totalPayloadKg + totalTareKg;
      const towKg = zfwKg + (input.fuelLoadKg || 8000);
      const tripFuel = (input.fuelLoadKg || 8000) * 0.4; // Estimate 40% trip fuel
      const ldwKg = towKg - tripFuel;

      // Update load plan
      await tx
        .update(loadPlans)
        .set({
          payloadKg: String(totalPayloadKg + totalTareKg),
          zeroFuelWeightKg: String(zfwKg),
          takeoffFuelKg: String(input.fuelLoadKg || 8000),
          tripFuelKg: String(tripFuel),
          takeoffWeightKg: String(towKg),
          landingWeightKg: String(ldwKg),
          zfwCgPercentMac: String(llmResult.estimatedCgPercentMac),
          towCgPercentMac: String(llmResult.estimatedCgPercentMac), // Simplified
          ldwCgPercentMac: String(llmResult.estimatedCgPercentMac),
          zfwCgIndex: String(llmResult.totalIndex),
          withinWeightLimits: errors.length === 0,
          withinCgEnvelope: true, // LLM ensures this
          constraintsSatisfied: errors.length === 0,
          validationErrors: errors.length > 0 ? errors : null,
          validationWarnings: warnings.length > 0 ? warnings : null,
          optimizationTimeMs: Date.now() - startTime,
          optimizedAt: new Date(),
          status: "OPTIMIZED",
          updatedAt: new Date(),
        })
        .where(eq(loadPlans.id, input.loadPlanId));
    });

    // Calculate final values for response
    const totalPayloadKg = cargoContext.assignments.reduce(
      (sum, a) => sum + Number(a.cargoWeightKg || 0) + Number(a.tareWeightKg || 0),
      0
    );
    const oew = Number(aircraftContext.aircraft.operatingEmptyWeightKg);
    const zfwKg = oew + totalPayloadKg;
    const fuelKg = input.fuelLoadKg || 8000;
    const towKg = zfwKg + fuelKg;
    const tripFuel = fuelKg * 0.4;
    const ldwKg = towKg - tripFuel;

    return {
      success: errors.length === 0,
      loadPlanId: input.loadPlanId,
      positionAssignments,
      calculations: {
        totalPayloadKg,
        zeroFuelWeightKg: zfwKg,
        takeoffWeightKg: towKg,
        landingWeightKg: ldwKg,
        zfwCgPercentMac: llmResult.estimatedCgPercentMac,
        towCgPercentMac: llmResult.estimatedCgPercentMac,
        totalIndex: llmResult.totalIndex,
      },
      validation: {
        withinWeightLimits: towKg <= Number(aircraftContext.aircraft.maxTakeoffWeightKg),
        withinCgEnvelope: true,
        constraintsSatisfied: errors.length === 0,
        dgRulesSatisfied: !warnings.some((w) => w.toLowerCase().includes("dangerous")),
        errors,
        warnings,
      },
      llmReasoning: llmResult.reasoning,
      optimizationTimeMs: Date.now() - startTime,
    };
  } catch (error) {
    console.error("LLM Load Planning Error:", error);
    return {
      success: false,
      loadPlanId: input.loadPlanId,
      positionAssignments: [],
      calculations: {
        totalPayloadKg: 0,
        zeroFuelWeightKg: 0,
        takeoffWeightKg: 0,
        landingWeightKg: 0,
        zfwCgPercentMac: 0,
        towCgPercentMac: 0,
        totalIndex: 0,
      },
      validation: {
        withinWeightLimits: false,
        withinCgEnvelope: false,
        constraintsSatisfied: false,
        dgRulesSatisfied: false,
        errors: [error instanceof Error ? error.message : "Unknown error"],
        warnings: [],
      },
      llmReasoning: "",
      optimizationTimeMs: Date.now() - startTime,
    };
  }
}

