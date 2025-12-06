/**
 * Load Planning Test Cases
 * 
 * This script tests the complete load planning workflow:
 * 1. Build-up: Assign cargo to ULDs
 * 2. Optimization: Use LLM to optimize positions
 * 3. Validation: Verify rules are followed and load is balanced
 */

import dotenv from "dotenv";
dotenv.config();

import { db } from "../src/lib/db";
import {
  flights,
  loadPlans,
  uldAssignments,
  positionLoads,
  cargoItems,
  packingRules,
  aircrafts,
  deckConfigurations,
  loadingPositions,
  weightConstraints,
  cgEnvelopes,
  ulds,
  uldTypes,
  packedItems,
} from "../src/lib/db/schema";
import { eq, and, inArray, sql } from "drizzle-orm";
import { optimizeLoadPlanWithLlm } from "../src/lib/services/llmLoadPlanning";

// ============================================================================
// TEST CASE DEFINITIONS
// ============================================================================

interface TestCase {
  name: string;
  description: string;
  scenario: string;
  expectedOutcome: string;
}

const TEST_CASES: TestCase[] = [
  {
    name: "TC1: Basic Load Balancing",
    description: "Test basic weight distribution across aircraft positions",
    scenario: `
      - Load 4 ULDs with varying weights (light, medium, heavy)
      - Include general cargo only (no DG, no temp control)
      - Target CG: 28% MAC (center of envelope)
    `,
    expectedOutcome: `
      - Heavy ULDs should be placed near CG neutral positions (U7, U8)
      - Light ULDs should balance heavy ones (forward/aft as needed)
      - Total payload within aircraft limits
      - CG within 25-32% MAC range
    `,
  },
  {
    name: "TC2: Dangerous Goods Segregation",
    description: "Test DG segregation rules (lithium batteries)",
    scenario: `
      - Load ULD with lithium batteries (DG Class 9)
      - Load ULD with perishables (food)
      - Load ULD with general cargo
    `,
    expectedOutcome: `
      - DG cargo should be placed in center/aft positions (safer for fire containment)
      - DG should be separated from food/perishables
      - LLM should explain DG handling in reasoning
    `,
  },
  {
    name: "TC3: Temperature-Controlled Cargo",
    description: "Test handling of temperature-controlled cargo",
    scenario: `
      - Load pharmaceuticals requiring 2-8°C
      - Load general cargo
      - Use RKN (refrigerated) container
    `,
    expectedOutcome: `
      - Temp-controlled cargo in appropriate container type
      - Positioned away from heat sources
      - Priority handling noted
    `,
  },
  {
    name: "TC4: Weight Constraint Compliance",
    description: "Test combined weight constraints (forward cargo hold)",
    scenario: `
      - Load heavy cargo in forward positions
      - Check constraint: Forward cargo hold limit (positions 11, 12, 21, 22)
    `,
    expectedOutcome: `
      - Combined weight in forward hold <= structural limit
      - If limit exceeded, redistribute to aft positions
      - Warning generated if approaching limits
    `,
  },
  {
    name: "TC5: Mixed Priority Cargo",
    description: "Test handling of EXPRESS vs STANDARD priority",
    scenario: `
      - Load EXPRESS priority cargo (valuables, pharmaceuticals)
      - Load STANDARD priority cargo (textiles, electronics)
    `,
    expectedOutcome: `
      - EXPRESS cargo considered for optimal accessibility
      - Balance maintained regardless of priority
      - All cargo assigned to valid positions
    `,
  },
];

// ============================================================================
// TEST HELPERS
// ============================================================================

async function clearTestData(flightId: string) {
  // Get load plan
  const [loadPlan] = await db.select().from(loadPlans).where(eq(loadPlans.flightId, flightId));
  
  if (loadPlan) {
    // Clear in order
    await db.delete(packedItems).where(
      sql`${packedItems.uldAssignmentId} IN (SELECT id FROM uld_assignments WHERE load_plan_id = ${loadPlan.id})`
    );
    await db.delete(positionLoads).where(eq(positionLoads.loadPlanId, loadPlan.id));
    await db.delete(uldAssignments).where(eq(uldAssignments.loadPlanId, loadPlan.id));
    await db.delete(loadPlans).where(eq(loadPlans.id, loadPlan.id));
  }

  // Reset cargo items
  await db.update(cargoItems).set({
    assignedUldId: null,
    loadStatus: "PENDING",
  });
}

async function getTestFlight() {
  const [flight] = await db
    .select()
    .from(flights)
    .where(eq(flights.flightNumber, "RY501"));
  return flight;
}

async function createLoadPlan(flightId: string, aircraftId: string) {
  // Keep plan number under 20 chars
  const shortId = Date.now().toString().slice(-8);
  const [plan] = await db
    .insert(loadPlans)
    .values({
      flightId,
      aircraftId,
      planNumber: `LP-T-${shortId}`,
      status: "DRAFT",
    })
    .returning();
  return plan;
}

async function assignCargoToUld(
  loadPlanId: string,
  uldTypeId: string,
  uldNumber: string,
  cargoItemIds: string[],
  isBulk: boolean = false
) {
  // Get ULD type for tare weight
  const [uldType] = await db.select().from(uldTypes).where(eq(uldTypes.id, uldTypeId));
  
  // Calculate totals
  const cargo = await db.select().from(cargoItems).where(inArray(cargoItems.id, cargoItemIds));
  const cargoWeightKg = cargo.reduce((sum, c) => sum + Number(c.weightKg || 0), 0);
  const volumeUsedM3 = cargo.reduce((sum, c) => sum + Number(c.volumeM3 || 0), 0);
  const tareWeightKg = isBulk ? 0 : Number(uldType?.tareWeightKg || 0);
  
  // Get sequence
  const existing = await db.select().from(uldAssignments).where(eq(uldAssignments.loadPlanId, loadPlanId));
  const sequence = existing.length + 1;

  // Create assignment
  const [assignment] = await db
    .insert(uldAssignments)
    .values({
      loadPlanId,
      uldTypeId,
      uldNumber: isBulk ? `BULK-${sequence}` : uldNumber,
      sequence,
      totalWeightKg: String(cargoWeightKg + tareWeightKg),
      tareWeightKg: String(tareWeightKg),
      cargoWeightKg: String(cargoWeightKg),
      volumeUsedM3: String(volumeUsedM3),
      isVirtual: isBulk,
      status: "PLANNED",
    })
    .returning();

  // Create packed items
  let seq = 0;
  for (const cargoItem of cargo) {
    seq++;
    await db.insert(packedItems).values({
      uldAssignmentId: assignment.id,
      cargoItemId: cargoItem.id,
      sequence: seq,
      xPositionCm: "0",
      yPositionCm: "0",
      zPositionCm: "0",
      rotated: false,
      packedLengthCm: cargoItem.lengthCm,
      packedWidthCm: cargoItem.widthCm,
      packedHeightCm: cargoItem.heightCm,
    });

    // Update cargo status
    await db.update(cargoItems).set({
      assignedUldId: assignment.id,
      loadStatus: isBulk ? "BULK_ASSIGNED" : "ASSIGNED",
    }).where(eq(cargoItems.id, cargoItem.id));
  }

  return assignment;
}

// ============================================================================
// TEST EXECUTION
// ============================================================================

async function runTest(testCase: TestCase) {
  console.log("\n" + "=".repeat(80));
  console.log(`🧪 ${testCase.name}`);
  console.log("=".repeat(80));
  console.log(`📋 Description: ${testCase.description}`);
  console.log(`\n📝 Scenario:${testCase.scenario}`);
  console.log(`\n✅ Expected:${testCase.expectedOutcome}`);
  console.log("-".repeat(80));
}

async function runTestCase1() {
  await runTest(TEST_CASES[0]);
  
  const flight = await getTestFlight();
  if (!flight) {
    console.log("❌ Test flight RY501 not found. Run db:seed first.");
    return null;
  }

  // Clear any existing test data
  await clearTestData(flight.id);
  
  // Create new load plan
  const loadPlan = await createLoadPlan(flight.id, flight.aircraftId);
  console.log(`\n📦 Created load plan: ${loadPlan.planNumber}`);

  // Get cargo items and ULD types
  const allCargo = await db.select().from(cargoItems);
  const [pmcType] = await db.select().from(uldTypes).where(eq(uldTypes.code, "PMC"));
  const [akeType] = await db.select().from(uldTypes).where(eq(uldTypes.code, "AKE"));

  // Filter for general cargo (no DG)
  const generalCargo = allCargo.filter(c => !c.isDangerousGoods && !c.tempZoneId);
  
  console.log(`\n📊 Available general cargo items: ${generalCargo.length}`);

  // Assign cargo to ULDs
  // ULD 1: Light cargo (electronics - tablets)
  const lightCargo = generalCargo.filter(c => Number(c.weightKg) < 100);
  if (lightCargo.length > 0) {
    const uld1 = await assignCargoToUld(loadPlan.id, akeType.id, "AKE-TEST-001", lightCargo.slice(0, 2).map(c => c.id));
    console.log(`  • ULD 1 (Light): ${uld1.cargoWeightKg} kg`);
  }

  // ULD 2: Medium cargo
  const mediumCargo = generalCargo.filter(c => Number(c.weightKg) >= 100 && Number(c.weightKg) < 200);
  if (mediumCargo.length > 0) {
    const uld2 = await assignCargoToUld(loadPlan.id, pmcType.id, "PMC-TEST-001", mediumCargo.slice(0, 2).map(c => c.id));
    console.log(`  • ULD 2 (Medium): ${uld2.cargoWeightKg} kg`);
  }

  // ULD 3: Heavy cargo
  const heavyCargo = generalCargo.filter(c => Number(c.weightKg) >= 200);
  if (heavyCargo.length > 0) {
    const uld3 = await assignCargoToUld(loadPlan.id, pmcType.id, "PMC-TEST-002", heavyCargo.slice(0, 2).map(c => c.id));
    console.log(`  • ULD 3 (Heavy): ${uld3.cargoWeightKg} kg`);
  }

  // ULD 4: Mixed cargo
  const remainingCargo = generalCargo.filter(c => 
    !lightCargo.slice(0, 2).includes(c) && 
    !mediumCargo.slice(0, 2).includes(c) && 
    !heavyCargo.slice(0, 2).includes(c)
  );
  if (remainingCargo.length > 0) {
    const uld4 = await assignCargoToUld(loadPlan.id, pmcType.id, "PMC-TEST-003", remainingCargo.slice(0, 2).map(c => c.id));
    console.log(`  • ULD 4 (Mixed): ${uld4.cargoWeightKg} kg`);
  }

  // Update status
  await db.update(loadPlans).set({ status: "BUILD_UP_COMPLETE" }).where(eq(loadPlans.id, loadPlan.id));

  return loadPlan;
}

async function runTestCase2() {
  await runTest(TEST_CASES[1]);
  
  const flight = await getTestFlight();
  if (!flight) return null;

  await clearTestData(flight.id);
  const loadPlan = await createLoadPlan(flight.id, flight.aircraftId);
  console.log(`\n📦 Created load plan: ${loadPlan.planNumber}`);

  const allCargo = await db.select().from(cargoItems);
  const [pmcType] = await db.select().from(uldTypes).where(eq(uldTypes.code, "PMC"));

  // DG cargo (lithium batteries)
  const dgCargo = allCargo.filter(c => c.isDangerousGoods);
  console.log(`\n📊 DG cargo items: ${dgCargo.length}`);
  
  // Food/perishable cargo
  const perishableCargo = allCargo.filter(c => c.isFoodstuff || c.specialHandlingCodes?.includes("PER"));
  console.log(`📊 Perishable cargo items: ${perishableCargo.length}`);
  
  // General cargo
  const generalCargo = allCargo.filter(c => !c.isDangerousGoods && !c.isFoodstuff);
  console.log(`📊 General cargo items: ${generalCargo.length}`);

  // Assign to ULDs
  if (dgCargo.length > 0) {
    const dgUld = await assignCargoToUld(loadPlan.id, pmcType.id, "PMC-DG-001", dgCargo.slice(0, 3).map(c => c.id));
    console.log(`  • DG ULD: ${dgUld.cargoWeightKg} kg (Lithium Batteries)`);
  }

  if (perishableCargo.length > 0) {
    const perUld = await assignCargoToUld(loadPlan.id, pmcType.id, "PMC-PER-001", perishableCargo.slice(0, 1).map(c => c.id));
    console.log(`  • Perishable ULD: ${perUld.cargoWeightKg} kg`);
  }

  if (generalCargo.length > 0) {
    const genUld = await assignCargoToUld(loadPlan.id, pmcType.id, "PMC-GEN-001", generalCargo.slice(0, 3).map(c => c.id));
    console.log(`  • General ULD: ${genUld.cargoWeightKg} kg`);
  }

  await db.update(loadPlans).set({ status: "BUILD_UP_COMPLETE" }).where(eq(loadPlans.id, loadPlan.id));
  
  return loadPlan;
}

async function runOptimization(loadPlan: typeof loadPlans.$inferSelect) {
  console.log("\n🤖 Running LLM optimization...");
  
  // Get active packing rules
  const rules = await db.select().from(packingRules).where(eq(packingRules.isActive, true));
  console.log(`📋 Applying ${rules.length} packing rules`);

  const startTime = Date.now();
  
  try {
    const result = await optimizeLoadPlanWithLlm({
      loadPlanId: loadPlan.id,
      selectedRuleIds: rules.map(r => r.id),
      fuelLoadKg: 8000,
      targetCgPercentMac: 28.0,
    });

    const elapsed = Date.now() - startTime;
    
    console.log(`\n⏱️  Optimization completed in ${elapsed}ms`);
    console.log("\n" + "-".repeat(80));
    console.log("📊 RESULTS");
    console.log("-".repeat(80));
    
    console.log("\n🎯 Position Assignments:");
    for (const assignment of result.positionAssignments) {
      console.log(`  • ${assignment.positionCode}: ${assignment.reason}`);
    }

    console.log("\n⚖️  Weight & Balance:");
    console.log(`  • Total Payload: ${result.calculations.totalPayloadKg.toFixed(0)} kg`);
    console.log(`  • Zero Fuel Weight: ${result.calculations.zeroFuelWeightKg.toFixed(0)} kg`);
    console.log(`  • Takeoff Weight: ${result.calculations.takeoffWeightKg.toFixed(0)} kg`);
    console.log(`  • Landing Weight: ${result.calculations.landingWeightKg.toFixed(0)} kg`);
    console.log(`  • ZFW CG: ${result.calculations.zfwCgPercentMac.toFixed(1)}% MAC`);
    console.log(`  • TOW CG: ${result.calculations.towCgPercentMac.toFixed(1)}% MAC`);
    console.log(`  • Total Index: ${result.calculations.totalIndex.toFixed(1)}`);

    console.log("\n✅ Validation:");
    console.log(`  • Within Weight Limits: ${result.validation.withinWeightLimits ? "✅ Yes" : "❌ No"}`);
    console.log(`  • Within CG Envelope: ${result.validation.withinCgEnvelope ? "✅ Yes" : "❌ No"}`);
    console.log(`  • Constraints Satisfied: ${result.validation.constraintsSatisfied ? "✅ Yes" : "❌ No"}`);
    console.log(`  • DG Rules Satisfied: ${result.validation.dgRulesSatisfied ? "✅ Yes" : "❌ No"}`);

    if (result.validation.errors.length > 0) {
      console.log("\n❌ Errors:");
      result.validation.errors.forEach(e => console.log(`  • ${e}`));
    }

    if (result.validation.warnings.length > 0) {
      console.log("\n⚠️  Warnings:");
      result.validation.warnings.forEach(w => console.log(`  • ${w}`));
    }

    console.log("\n💭 LLM Reasoning:");
    console.log(result.llmReasoning);

    return result;
  } catch (error) {
    console.error("❌ Optimization failed:", error);
    return null;
  }
}

async function validateResults(loadPlanId: string) {
  console.log("\n" + "-".repeat(80));
  console.log("🔍 VALIDATION CHECK");
  console.log("-".repeat(80));

  // Get position loads
  const positions = await db.select().from(positionLoads).where(eq(positionLoads.loadPlanId, loadPlanId));
  
  // Get aircraft info
  const [plan] = await db.select().from(loadPlans).where(eq(loadPlans.id, loadPlanId));
  const [aircraft] = await db.select().from(aircrafts).where(eq(aircrafts.id, plan.aircraftId));

  // Check weight distribution
  const mainDeckPositions = positions.filter(p => p.positionCode.startsWith("U"));
  const lowerDeckPositions = positions.filter(p => !p.positionCode.startsWith("U"));

  const mainDeckWeight = mainDeckPositions.reduce((sum, p) => sum + Number(p.grossWeightKg || 0), 0);
  const lowerDeckWeight = lowerDeckPositions.reduce((sum, p) => sum + Number(p.grossWeightKg || 0), 0);

  console.log("\n📊 Weight Distribution:");
  console.log(`  • Main Deck: ${mainDeckWeight.toFixed(0)} kg (max: ${aircraft.mainDeckMaxWeightKg} kg)`);
  console.log(`  • Lower Deck: ${lowerDeckWeight.toFixed(0)} kg (max: ${aircraft.lowerDeckMaxWeightKg} kg)`);
  console.log(`  • Total: ${(mainDeckWeight + lowerDeckWeight).toFixed(0)} kg`);

  // Check position limits
  const decks = await db.select().from(deckConfigurations).where(eq(deckConfigurations.aircraftId, aircraft.id));
  
  let positionLimitsOk = true;
  console.log("\n📍 Position Limit Check:");
  
  for (const pos of positions) {
    // Find position config
    for (const deck of decks) {
      const [posConfig] = await db.select().from(loadingPositions)
        .where(and(eq(loadingPositions.deckId, deck.id), eq(loadingPositions.positionCode, pos.positionCode)));
      
      if (posConfig) {
        const weight = Number(pos.grossWeightKg || 0);
        const maxWeight = Number(posConfig.maxWeightKg);
        const ok = weight <= maxWeight;
        if (!ok) positionLimitsOk = false;
        console.log(`  • ${pos.positionCode}: ${weight.toFixed(0)}/${maxWeight.toFixed(0)} kg ${ok ? "✅" : "❌ EXCEEDED"}`);
        break;
      }
    }
  }

  // Check weight constraints
  const constraints = await db.select().from(weightConstraints)
    .where(and(eq(weightConstraints.aircraftId, aircraft.id), eq(weightConstraints.isActive, true)));

  console.log("\n⚖️  Combined Weight Constraints:");
  let constraintsOk = true;

  for (const constraint of constraints) {
    const affectedPositions = positions.filter(p => constraint.affectedPositions.includes(p.positionCode));
    const combinedWeight = affectedPositions.reduce((sum, p) => sum + Number(p.grossWeightKg || 0), 0);
    const maxWeight = Number(constraint.maxCombinedWeightKg);
    const ok = combinedWeight <= maxWeight;
    if (!ok) constraintsOk = false;
    console.log(`  • ${constraint.name}: ${combinedWeight.toFixed(0)}/${maxWeight.toFixed(0)} kg ${ok ? "✅" : "❌ EXCEEDED"}`);
  }

  // Check CG
  const cgEnvelopeList = await db.select().from(cgEnvelopes).where(eq(cgEnvelopes.aircraftId, aircraft.id));
  const zfwCg = Number(plan.zfwCgPercentMac || 0);

  console.log("\n📐 CG Envelope Check:");
  let cgOk = true;
  
  for (const envelope of cgEnvelopeList) {
    const fwd = Number(envelope.forwardLimitPercentMac);
    const aft = Number(envelope.aftLimitPercentMac);
    const inEnvelope = zfwCg >= fwd && zfwCg <= aft;
    if (!inEnvelope && envelope.envelopeType === "ZERO_FUEL") cgOk = false;
    console.log(`  • ${envelope.envelopeType}: ${zfwCg.toFixed(1)}% MAC (${fwd}-${aft}%) ${inEnvelope ? "✅" : "❌ OUT OF ENVELOPE"}`);
  }

  // Summary
  console.log("\n" + "=".repeat(80));
  console.log("📋 VALIDATION SUMMARY");
  console.log("=".repeat(80));
  console.log(`  • Position Limits: ${positionLimitsOk ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`  • Weight Constraints: ${constraintsOk ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`  • CG Envelope: ${cgOk ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`  • Overall: ${positionLimitsOk && constraintsOk && cgOk ? "✅ ALL TESTS PASSED" : "❌ SOME TESTS FAILED"}`);

  return { positionLimitsOk, constraintsOk, cgOk };
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log("╔════════════════════════════════════════════════════════════════════════════╗");
  console.log("║               LOAD PLANNING SYSTEM - TEST SUITE                            ║");
  console.log("╚════════════════════════════════════════════════════════════════════════════╝");

  // Check for API key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log("\n⚠️  ANTHROPIC_API_KEY not set. Add it to .env file.");
    console.log("   Tests will run but LLM optimization will fail.\n");
  }

  try {
    // Run Test Case 1: Basic Load Balancing
    console.log("\n\n" + "█".repeat(80));
    console.log("█ TEST CASE 1: BASIC LOAD BALANCING");
    console.log("█".repeat(80));
    
    const loadPlan1 = await runTestCase1();
    if (loadPlan1) {
      const result1 = await runOptimization(loadPlan1);
      if (result1?.success) {
        await validateResults(loadPlan1.id);
      }
    }

    // Run Test Case 2: DG Segregation
    console.log("\n\n" + "█".repeat(80));
    console.log("█ TEST CASE 2: DANGEROUS GOODS SEGREGATION");
    console.log("█".repeat(80));
    
    const loadPlan2 = await runTestCase2();
    if (loadPlan2) {
      const result2 = await runOptimization(loadPlan2);
      if (result2?.success) {
        await validateResults(loadPlan2.id);
      }
    }

    console.log("\n\n" + "═".repeat(80));
    console.log("TEST SUITE COMPLETED");
    console.log("═".repeat(80));

  } catch (error) {
    console.error("\n❌ Test suite error:", error);
  }

  process.exit(0);
}

main();

