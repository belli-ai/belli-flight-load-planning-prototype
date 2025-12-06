/**
 * Anthropic Claude LLM Client
 *
 * Integration with Claude for:
 * - Parsing natural language packing rules
 * - Generating human-readable build-up instructions
 * - Explaining optimization decisions
 * - LLM-based cargo optimization
 */

import Anthropic from "@anthropic-ai/sdk";
import type {
  PackingRule,
  StructuredRule,
  BuildUpInstruction,
  BuildUpStep,
  UldAssignmentResult,
  PackedItemResult,
} from "../../types";
import type { CargoItemDisplay } from "@/features/cargo";
import type {
  CargoItemForPacking,
  UldTypeForPacking,
  PackingConstraint,
  OptimizerOptions,
  OptimizationOutput,
  UldAssignmentOutput,
  AircraftConfigForPacking,
  UldInventoryItem,
} from "../algorithm/types";

// ============================================================================
// CLIENT INITIALIZATION
// ============================================================================

let anthropicClient: Anthropic | null = null;

function getClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY environment variable is not set");
    }
    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
}

// ============================================================================
// RULE PROCESSING
// ============================================================================

const RULE_PARSING_SYSTEM_PROMPT = `You are an expert cargo loading specialist. Your task is to parse natural language packing rules into structured constraints that can be used by a bin-packing algorithm.

For each rule, you should identify:
1. The rule type: "position" (where items go), "compatibility" (what can/can't go together), "weight" (weight-based constraints), "stacking" (vertical stacking rules), or "grouping" (items that should be together)
2. The condition that triggers the rule
3. The constraint that must be satisfied

Respond with valid JSON only, no explanation.`;

export async function parsePackingRule(
  ruleText: string
): Promise<StructuredRule> {
  const client = getClient();

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 500,
    system: RULE_PARSING_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Parse this packing rule into a structured format:

Rule: "${ruleText}"

Respond with JSON in this exact format:
{
  "type": "position" | "compatibility" | "weight" | "stacking" | "grouping",
  "condition": "the condition that triggers this rule",
  "constraint": "the constraint to apply",
  "parameters": { optional additional parameters }
}`,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  try {
    // Extract JSON from response (handle potential markdown code blocks)
    let jsonText = content.text.trim();
    if (jsonText.startsWith("```")) {
      jsonText = jsonText
        .replace(/```json?\n?/g, "")
        .replace(/```$/g, "")
        .trim();
    }
    return JSON.parse(jsonText) as StructuredRule;
  } catch {
    // Fallback to a generic constraint if parsing fails
    return {
      type: "compatibility",
      condition: ruleText,
      constraint: "apply rule",
    };
  }
}

export async function parseMultipleRules(
  rules: PackingRule[]
): Promise<Map<string, StructuredRule>> {
  const results = new Map<string, StructuredRule>();

  // Process rules in parallel (with limit)
  const batchSize = 5;
  for (let i = 0; i < rules.length; i += batchSize) {
    const batch = rules.slice(i, i + batchSize);
    const promises = batch.map(async (rule) => {
      if (rule.structuredRule) {
        // Already parsed
        results.set(rule.id, rule.structuredRule);
        return;
      }
      const structured = await parsePackingRule(rule.ruleText);
      results.set(rule.id, structured);
    });
    await Promise.all(promises);
  }

  return results;
}

// ============================================================================
// BUILD-UP INSTRUCTION GENERATION
// ============================================================================

const INSTRUCTION_SYSTEM_PROMPT = `You are an expert cargo loading specialist generating clear, step-by-step build-up instructions for ULD packing.

Your instructions should be:
1. Clear and actionable for warehouse staff
2. Include safety warnings where appropriate
3. Reference cargo by AWB number and description
4. Specify exact placement locations
5. Note any special handling requirements

Keep instructions concise but complete. Use professional cargo handling terminology.`;

type InstructionContext = {
  uldTypeCode: string;
  uldNumber: string;
  positionCode: string | null;
  cargoItems: {
    item: CargoItemDisplay;
    position: PackedItemResult;
  }[];
  totalWeightKg: number;
};

export async function generateBuildUpInstructions(
  context: InstructionContext
): Promise<BuildUpInstruction> {
  const client = getClient();

  const cargoList = context.cargoItems
    .map(
      ({ item, position }) =>
        `- AWB: ${item.awbNumber}, Piece #${item.pieceNumber}
   Description: ${item.description || "General cargo"}
   Weight: ${item.weightKg}kg
   Dimensions: ${item.lengthCm}x${item.widthCm}x${item.heightCm}cm
   Position: (${position.position.x}, ${position.position.y}, ${
          position.position.z
        })
   Special Handling: ${item.specialHandling.join(", ") || "None"}
   Dangerous Goods: ${item.isDangerousGoods ? "Yes" : "No"}`
    )
    .join("\n\n");

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1500,
    system: INSTRUCTION_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Generate build-up instructions for this ULD:

ULD Type: ${context.uldTypeCode}
ULD Number: ${context.uldNumber}
Aircraft Position: ${context.positionCode || "Not assigned"}
Total Weight: ${context.totalWeightKg}kg

Cargo to load (in packing order based on Z-coordinate, lowest first):
${cargoList}

Respond with JSON in this exact format:
{
  "steps": [
    {
      "sequence": 1,
      "action": "Clear action description",
      "cargoDescription": "Brief cargo description",
      "awbNumber": "AWB number",
      "weightKg": 0,
      "placement": "Where to place in ULD",
      "warnings": ["optional warning messages"]
    }
  ],
  "notes": ["General notes about this ULD build"],
  "estimatedBuildTimeMinutes": 15
}`,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  try {
    let jsonText = content.text.trim();
    if (jsonText.startsWith("```")) {
      jsonText = jsonText
        .replace(/```json?\n?/g, "")
        .replace(/```$/g, "")
        .trim();
    }
    const parsed = JSON.parse(jsonText) as {
      steps: BuildUpStep[];
      notes: string[];
      estimatedBuildTimeMinutes: number;
    };

    return {
      uldNumber: context.uldNumber,
      uldTypeCode: context.uldTypeCode,
      positionCode: context.positionCode,
      steps: parsed.steps,
      notes: parsed.notes,
      totalWeightKg: context.totalWeightKg,
      estimatedBuildTimeMinutes: parsed.estimatedBuildTimeMinutes,
    };
  } catch {
    // Fallback to basic instructions
    return {
      uldNumber: context.uldNumber,
      uldTypeCode: context.uldTypeCode,
      positionCode: context.positionCode,
      steps: context.cargoItems.map(({ item, position }, index) => ({
        sequence: index + 1,
        action: `Place cargo at position (${position.position.x}, ${position.position.y}, ${position.position.z})`,
        cargoDescription: item.description || "General cargo",
        awbNumber: item.awbNumber,
        weightKg: item.weightKg,
        placement: `X:${position.position.x} Y:${position.position.y} Z:${position.position.z}`,
      })),
      notes: ["Follow standard packing procedures"],
      totalWeightKg: context.totalWeightKg,
      estimatedBuildTimeMinutes: Math.ceil(context.cargoItems.length * 3),
    };
  }
}

// ============================================================================
// OPTIMIZATION EXPLANATION
// ============================================================================

const EXPLANATION_SYSTEM_PROMPT = `You are an expert cargo loading specialist explaining optimization decisions to users.

Provide clear, concise explanations of why cargo was arranged in a specific way, referencing:
1. Weight distribution principles
2. Compatibility rules applied
3. Space utilization strategies
4. Safety considerations

Keep explanations accessible to non-technical users while being accurate.`;

export async function explainOptimization(
  assignments: UldAssignmentResult[],
  appliedRules: PackingRule[]
): Promise<string> {
  const client = getClient();

  const assignmentSummary = assignments
    .map(
      (a) =>
        `ULD ${a.uldTypeCode} at ${a.positionCode}: ${
          a.cargoItems.length
        } items, ${a.totalWeightKg}kg, ${Math.round(
          a.volumeUtilization * 100
        )}% volume used`
    )
    .join("\n");

  const rulesSummary = appliedRules.map((r) => `- ${r.ruleText}`).join("\n");

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 800,
    system: EXPLANATION_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Explain this cargo optimization result in 2-3 paragraphs:

Optimization Result:
${assignmentSummary}

Rules Applied:
${rulesSummary}

Focus on the key decisions and benefits of this arrangement.`,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    return "Optimization complete. Cargo has been arranged according to weight distribution and compatibility rules.";
  }

  return content.text;
}

// ============================================================================
// NATURAL LANGUAGE QUERY
// ============================================================================

export async function answerCargoQuestion(
  question: string,
  context: {
    flights: Array<{ flightNumber: string; route: string }>;
    cargoCount: number;
    uldCount: number;
  }
): Promise<string> {
  const client = getClient();

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 500,
    system: `You are a helpful cargo loading assistant. Answer questions about cargo operations concisely and accurately.

Current context:
- Active flights: ${context.flights
      .map((f) => `${f.flightNumber} (${f.route})`)
      .join(", ")}
- Total cargo items: ${context.cargoCount}
- ULDs in use: ${context.uldCount}`,
    messages: [
      {
        role: "user",
        content: question,
      },
    ],
  });

  const content = response.content[0];
  return content.type === "text"
    ? content.text
    : "I couldn't process that question.";
}

// ============================================================================
// LLM-BASED OPTIMIZATION
// ============================================================================

/**
 * Input for LLM optimization
 */
export type LlmOptimizerInput = {
  cargoItems: CargoItemForPacking[];
  uldTypes: UldTypeForPacking[];
  constraints: PackingConstraint[];
  options: OptimizerOptions;
  aircraftConfig?: AircraftConfigForPacking;
  uldInventory?: UldInventoryItem[];
  /** Previous validation errors for retry */
  previousErrors?: string[];
};

const OPTIMIZATION_SYSTEM_PROMPT = `You are an expert cargo loading optimization system. Your task is to pack cargo items into ULDs (Unit Load Devices) efficiently.

## COORDINATE SYSTEM
- Origin (0,0,0) is at the FRONT-LEFT-BOTTOM corner of the ULD
- X-axis: Length (front=0 to back)
- Y-axis: Width (left=0 to right)  
- Z-axis: Height (bottom=0 to top)
- Items are placed by their front-left-bottom corner position

## CRITICAL DIMENSION CONSTRAINTS (MUST NOT VIOLATE)
For each item placed at position (x, y, z) with dimensions (length, width, height):
- x + length MUST BE ≤ ULD internal length
- y + width MUST BE ≤ ULD internal width
- z + height MUST BE ≤ ULD internal height
- All coordinates must be ≥ 0

## CRITICAL WEIGHT CONSTRAINTS (MUST NOT VIOLATE)
- Each ULD has a TARE WEIGHT (empty weight) and MAX GROSS WEIGHT
- Max payload = maxGrossWeight - tareWeight
- Sum of all cargo weights in a ULD MUST NOT exceed max payload
- totalWeightKg = tareWeightKg + cargoWeightKg (EXACTLY)
- cargoWeightKg = sum of all packed item weights

## PACKING RULES
1. NO OVERLAPPING: Items cannot share the same space
2. GRAVITY: Items must rest on the floor (z=0) or on top of other items
3. HEAVY ITEMS FIRST: Place heavier items at lower Z positions
4. ROTATION: Items may be rotated 90° around Z-axis (swap length↔width)

## OUTPUT ACCURACY
- Copy dimensions EXACTLY from input cargo data
- Copy weights EXACTLY from input cargo data
- Calculate totals by summing actual values
- Use ULD type's exact tareWeight value`;

/**
 * Build the user prompt with cargo and ULD data
 */
function buildOptimizationPrompt(input: LlmOptimizerInput): string {
  const {
    cargoItems,
    uldTypes,
    constraints,
    options,
    uldInventory,
    previousErrors,
  } = input;

  // Format cargo items with clear dimension mapping
  const cargoList = cargoItems
    .map(
      (item) =>
        `  ─────────────────────────────────────────
  ID: "${item.id}"
  AWB: ${item.awbNumber}, Piece: ${item.pieceNumber}
  ┌ DIMENSIONS (use these exact values in output):
  │  Length (X-axis): ${item.lengthCm} cm
  │  Width (Y-axis):  ${item.widthCm} cm
  │  Height (Z-axis): ${item.heightCm} cm
  └ WEIGHT: ${item.weightKg} kg
  Stackable: ${item.isStackable}${
          item.maxStackWeightKg
            ? `, Max Stack: ${item.maxStackWeightKg} kg`
            : ""
        }
  Priority: ${item.priority}${
          item.isDangerousGoods ? ` | DG: ${item.dgClassCode}` : ""
        }${item.tempZoneCode ? ` | Temp: ${item.tempZoneCode}` : ""}`
    )
    .join("\n");

  // Format ULD types with clear dimension limits
  const uldTypeList = uldTypes
    .map(
      (uld) =>
        `  ┌─ ULD TYPE: ${uld.code} (ID: "${uld.id}")
  │  Category: ${uld.category}
  │  ╔══════════════════════════════════════════════════╗
  │  ║ INTERNAL DIMENSIONS (items must fit within):    ║
  │  ║   Length (X): ${String(uld.internalLengthCm).padEnd(
    8
  )} cm (max x + item.length)  ║
  │  ║   Width (Y):  ${String(uld.internalWidthCm).padEnd(
    8
  )} cm (max y + item.width)   ║
  │  ║   Height (Z): ${String(uld.internalHeightCm).padEnd(
    8
  )} cm (max z + item.height)  ║
  │  ╠══════════════════════════════════════════════════╣
  │  ║ WEIGHT LIMITS:                                   ║
  │  ║   Tare Weight:     ${String(uld.tareWeightKg).padEnd(
    8
  )} kg (use this exact value) ║
  │  ║   Max Gross:       ${String(uld.maxGrossWeightKg).padEnd(
    8
  )} kg                    ║
  │  ║   Max Payload:     ${String(
    uld.maxGrossWeightKg - uld.tareWeightKg
  ).padEnd(8)} kg (cargo limit)       ║
  │  ╚══════════════════════════════════════════════════╝
  └─ Refrigerated: ${uld.isRefrigerated ? "Yes" : "No"}`
    )
    .join("\n\n");

  // Format available inventory ULDs
  let inventorySection = "";
  if (uldInventory && uldInventory.length > 0) {
    const inventoryList = uldInventory
      .slice(0, 20) // Limit to first 20 to avoid too long prompts
      .map(
        (uld) =>
          `  - ULD Number: "${uld.uldNumber}" (ID: "${uld.id}")
    Type: ${uld.uldType.code}
    Owner: ${uld.ownerCode ?? "Unknown"}`
      )
      .join("\n");
    inventorySection = `\n## AVAILABLE ULD INVENTORY (use these first)
${inventoryList}
Note: Prefer using physical ULDs from inventory. If more ULDs are needed, create virtual ones.\n`;
  }

  // Format constraints
  const constraintList =
    constraints.length > 0
      ? constraints
          .map((c) => `  - [${c.type}] ${c.condition}: ${c.constraint}`)
          .join("\n")
      : "  No specific constraints";

  // Format retry errors
  let errorSection = "";
  if (previousErrors && previousErrors.length > 0) {
    errorSection = `\n## PREVIOUS ERRORS TO FIX
Your previous response had these validation errors that you MUST fix:
${previousErrors.map((e) => `  - ${e}`).join("\n")}
\n`;
  }

  // Create a quick reference table for ULD limits
  const uldQuickRef = uldTypes
    .map(
      (uld) =>
        `  ${uld.code}: Max ${uld.internalLengthCm}×${uld.internalWidthCm}×${
          uld.internalHeightCm
        }cm, Payload≤${uld.maxGrossWeightKg - uld.tareWeightKg}kg, Tare=${
          uld.tareWeightKg
        }kg`
    )
    .join("\n");

  return `## CARGO ITEMS TO PACK (${cargoItems.length} items, total ${cargoItems
    .reduce((s, c) => s + c.weightKg, 0)
    .toFixed(1)} kg)
${cargoList}

## ULD QUICK REFERENCE (MEMORIZE THESE LIMITS!)
${uldQuickRef}

## AVAILABLE ULD TYPES (DETAILED)
${uldTypeList}
${inventorySection}
## PACKING RULES
${constraintList}

## OPTIMIZATION OBJECTIVE: ${options.objective}
${
  options.objective === "MINIMIZE_ULDS"
    ? "Use the fewest ULDs possible while respecting all constraints."
    : ""
}
${
  options.objective === "MAXIMIZE_UTILIZATION"
    ? "Maximize volume and weight utilization of each ULD."
    : ""
}
${
  options.objective === "MINIMIZE_CG_DEVIATION"
    ? "Optimize weight distribution for balanced center of gravity."
    : ""
}
${
  options.objective === "BALANCED"
    ? "Balance between ULD count, utilization, and weight distribution."
    : ""
}
${
  options.allowRotation !== false
    ? "Rotation: Items may be rotated 90° around vertical axis."
    : "Rotation: NOT allowed."
}
${errorSection}
## REQUIRED OUTPUT FORMAT
Respond with ONLY valid JSON (no markdown, no explanation) matching this exact structure:
{
  "status": "OPTIMAL" | "FEASIBLE" | "INFEASIBLE",
  "assignments": [
    {
      "uldId": "physical-uld-id-from-inventory" | null,
      "uldNumber": "ULD-NUMBER" | null,
      "uldTypeId": "uld-type-id-from-above",
      "uldTypeCode": "PMC",
      "sequence": 1,
      "positionCode": null,
      "cargoItems": [
        {
          "cargoItemId": "exact-cargo-item-id-from-input",
          "position": { "x": 0, "y": 0, "z": 0 },
          "dimensions": { "length": 100, "width": 80, "height": 60 },
          "rotated": false,
          "rotationAxis": null,
          "sequence": 1
        }
      ],
      "totalWeightKg": 1620,
      "tareWeightKg": 120,
      "cargoWeightKg": 1500,
      "volumeUsedM3": 1.5,
      "volumeUtilization": 0.75,
      "weightUtilization": 0.65,
      "uldDimensions": { "lengthCm": 317.5, "widthCm": 243.8, "heightCm": 243.8 },
      "maxGrossWeightKg": 4500
    }
  ],
  "unassignedCargoIds": [],
  "warnings": [],
  "reasoning": "Brief explanation of packing strategy"
}

## CRITICAL VALIDATION RULES (YOUR OUTPUT WILL BE REJECTED IF VIOLATED):

1. WEIGHT CALCULATION:
   - cargoWeightKg = SUM of all packed cargo item weights (from input data)
   - totalWeightKg = tareWeightKg + cargoWeightKg (MUST BE EXACT)
   - tareWeightKg = EXACT value from ULD type specification above
   - cargoWeightKg MUST NOT exceed (maxGrossWeightKg - tareWeightKg)

2. DIMENSION CONSTRAINTS (for each item at position x,y,z with dimensions L,W,H):
   - x ≥ 0 AND x + L ≤ ULD.internalLengthCm
   - y ≥ 0 AND y + W ≤ ULD.internalWidthCm  
   - z ≥ 0 AND z + H ≤ ULD.internalHeightCm
   - If rotated=true, swap L↔W in the item dimensions

3. DIMENSIONS OUTPUT:
   - Copy item dimensions EXACTLY from input (or swap L↔W if rotated)
   - uldDimensions = EXACT internal dimensions from ULD type above

4. IDS:
   - Use EXACT cargo item IDs from the input list
   - Use EXACT ULD type IDs from the list above
   - Every cargo item must appear exactly once (assigned or unassigned)`;
}

/**
 * Parse LLM response and extract JSON
 */
function extractJsonFromResponse(text: string): unknown {
  let jsonText = text.trim();

  // Handle markdown code blocks
  if (jsonText.includes("```")) {
    const match = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) {
      jsonText = match[1].trim();
    }
  }

  // Try to find JSON object boundaries
  const startIdx = jsonText.indexOf("{");
  const endIdx = jsonText.lastIndexOf("}");
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    jsonText = jsonText.slice(startIdx, endIdx + 1);
  }

  return JSON.parse(jsonText);
}

/**
 * Run LLM-based optimization
 */
export async function runLlmOptimization(input: LlmOptimizerInput): Promise<{
  output: OptimizationOutput | null;
  rawResponse: string;
  error?: string;
}> {
  const client = getClient();
  const startTime = Date.now();

  try {
    const userPrompt = buildOptimizationPrompt(input);

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8000,
      system: OPTIMIZATION_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      return {
        output: null,
        rawResponse: "",
        error: "Unexpected response type from Claude",
      };
    }

    const rawResponse = content.text;

    try {
      const parsed = extractJsonFromResponse(rawResponse) as {
        status: string;
        assignments: Array<{
          uldId: string | null;
          uldNumber: string | null;
          uldTypeId: string;
          uldTypeCode: string;
          sequence: number;
          positionCode: string | null;
          cargoItems: Array<{
            cargoItemId: string;
            position: { x: number; y: number; z: number };
            dimensions: { length: number; width: number; height: number };
            rotated: boolean;
            rotationAxis: string | null;
            sequence: number;
          }>;
          totalWeightKg: number;
          tareWeightKg: number;
          cargoWeightKg: number;
          volumeUsedM3: number;
          volumeUtilization: number;
          weightUtilization: number;
          uldDimensions: {
            lengthCm: number;
            widthCm: number;
            heightCm: number;
          };
          maxGrossWeightKg: number;
        }>;
        unassignedCargoIds: string[];
        warnings: string[];
        reasoning?: string;
      };

      // Convert to OptimizationOutput format
      const output: OptimizationOutput = {
        status: (parsed.status as OptimizationOutput["status"]) || "FEASIBLE",
        assignments: parsed.assignments.map(
          (a): UldAssignmentOutput => ({
            uldId: a.uldId,
            uldNumber: a.uldNumber,
            uldTypeId: a.uldTypeId,
            uldTypeCode: a.uldTypeCode,
            sequence: a.sequence,
            positionCode: a.positionCode,
            cargoItems: a.cargoItems.map((item) => ({
              cargoItemId: item.cargoItemId,
              position: {
                x: item.position.x,
                y: item.position.y,
                z: item.position.z,
              },
              dimensions: {
                length: item.dimensions.length,
                width: item.dimensions.width,
                height: item.dimensions.height,
              },
              rotated: item.rotated,
              rotationAxis: (item.rotationAxis as "X" | "Y" | "Z") || null,
              sequence: item.sequence,
            })),
            totalWeightKg: a.totalWeightKg,
            tareWeightKg: a.tareWeightKg,
            cargoWeightKg: a.cargoWeightKg,
            volumeUsedM3: a.volumeUsedM3,
            volumeUtilization: a.volumeUtilization,
            weightUtilization: a.weightUtilization,
            uldDimensions: {
              lengthCm: a.uldDimensions.lengthCm,
              widthCm: a.uldDimensions.widthCm,
              heightCm: a.uldDimensions.heightCm,
            },
            maxGrossWeightKg: a.maxGrossWeightKg,
          })
        ),
        unassignedCargoIds: parsed.unassignedCargoIds || [],
        stats: calculateStats(parsed.assignments, input.cargoItems),
        computationTimeMs: Date.now() - startTime,
        warnings: parsed.warnings || [],
        algorithmUsed: "LLM",
      };

      return { output, rawResponse };
    } catch (parseError) {
      return {
        output: null,
        rawResponse,
        error: `Failed to parse LLM response: ${
          parseError instanceof Error ? parseError.message : "Unknown error"
        }`,
      };
    }
  } catch (error) {
    return {
      output: null,
      rawResponse: "",
      error: error instanceof Error ? error.message : "LLM optimization failed",
    };
  }
}

/**
 * Calculate optimization statistics from assignments
 */
function calculateStats(
  assignments: Array<{
    cargoItems: Array<{ cargoItemId: string }>;
    totalWeightKg: number;
    volumeUsedM3: number;
    volumeUtilization: number;
    weightUtilization: number;
    cargoWeightKg: number;
  }>,
  allCargoItems: CargoItemForPacking[]
): OptimizationOutput["stats"] {
  const assignedCargoIds = new Set(
    assignments.flatMap((a) => a.cargoItems.map((c) => c.cargoItemId))
  );

  const assignedCargo = allCargoItems.filter((c) => assignedCargoIds.has(c.id));
  const unassignedCargo = allCargoItems.filter(
    (c) => !assignedCargoIds.has(c.id)
  );

  const totalCargoWeight = assignedCargo.reduce((s, c) => s + c.weightKg, 0);
  const totalCargoVolume = assignedCargo.reduce((s, c) => s + c.volumeM3, 0);

  const avgVolumeUtilization =
    assignments.length > 0
      ? assignments.reduce((s, a) => s + a.volumeUtilization, 0) /
        assignments.length
      : 0;
  const avgWeightUtilization =
    assignments.length > 0
      ? assignments.reduce((s, a) => s + a.weightUtilization, 0) /
        assignments.length
      : 0;

  return {
    uldsUsed: assignments.length,
    totalCargoItems: assignedCargo.length,
    totalCargoWeight,
    totalCargoVolume,
    avgVolumeUtilization,
    avgWeightUtilization,
    unassignedCount: unassignedCargo.length,
    unassignedWeight: unassignedCargo.reduce((s, c) => s + c.weightKg, 0),
    unassignedVolume: unassignedCargo.reduce((s, c) => s + c.volumeM3, 0),
  };
}
