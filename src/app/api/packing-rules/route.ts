import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { packingRules } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// GET - List all packing rules
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const ruleType = searchParams.get("ruleType");
    const activeOnly = searchParams.get("activeOnly") !== "false";

    let query = db.select().from(packingRules);

    const conditions = [];
    if (activeOnly) {
      conditions.push(eq(packingRules.isActive, true));
    }
    if (category) {
      conditions.push(eq(packingRules.category, category));
    }
    if (ruleType) {
      conditions.push(eq(packingRules.ruleType, ruleType));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }

    const rules = await query.orderBy(packingRules.priority);

    // Group by category for easier selection
    const groupedRules: Record<string, typeof rules> = {};
    for (const rule of rules) {
      const cat = rule.category || "GENERAL";
      if (!groupedRules[cat]) {
        groupedRules[cat] = [];
      }
      groupedRules[cat].push(rule);
    }

    return NextResponse.json({
      success: true,
      data: {
        rules,
        grouped: groupedRules,
        total: rules.length,
      },
    });
  } catch (error) {
    console.error("Error fetching packing rules:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch packing rules" },
      { status: 500 }
    );
  }
}

// POST - Create a new packing rule
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const [newRule] = await db
      .insert(packingRules)
      .values({
        ruleText: body.ruleText,
        ruleType: body.ruleType,
        priority: body.priority || 50,
        category: body.category,
        isActive: body.isActive ?? true,
        examples: body.examples,
        structuredRule: body.structuredRule,
      })
      .returning();

    return NextResponse.json({ success: true, data: newRule }, { status: 201 });
  } catch (error) {
    console.error("Error creating packing rule:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create packing rule" },
      { status: 500 }
    );
  }
}

