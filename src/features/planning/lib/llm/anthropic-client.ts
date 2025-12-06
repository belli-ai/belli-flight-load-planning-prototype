/**
 * Anthropic Claude LLM Client
 *
 * Integration with Claude for:
 * - Parsing natural language packing rules
 * - Generating human-readable build-up instructions
 * - Explaining optimization decisions
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

export async function parsePackingRule(ruleText: string): Promise<StructuredRule> {
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
      jsonText = jsonText.replace(/```json?\n?/g, "").replace(/```$/g, "").trim();
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
   Position: (${position.position.x}, ${position.position.y}, ${position.position.z})
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
      jsonText = jsonText.replace(/```json?\n?/g, "").replace(/```$/g, "").trim();
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
        `ULD ${a.uldTypeCode} at ${a.positionCode}: ${a.cargoItems.length} items, ${a.totalWeightKg}kg, ${Math.round(a.volumeUtilization * 100)}% volume used`
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
- Active flights: ${context.flights.map((f) => `${f.flightNumber} (${f.route})`).join(", ")}
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
  return content.type === "text" ? content.text : "I couldn't process that question.";
}

