import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { packingRules } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET - Get a single packing rule by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [rule] = await db
      .select()
      .from(packingRules)
      .where(eq(packingRules.id, id))
      .limit(1);

    if (!rule) {
      return NextResponse.json(
        { success: false, error: "Packing rule not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: rule });
  } catch (error) {
    console.error("Error fetching packing rule:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch packing rule" },
      { status: 500 }
    );
  }
}

// PUT - Update a packing rule
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if rule exists
    const [existing] = await db
      .select()
      .from(packingRules)
      .where(eq(packingRules.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Packing rule not found" },
        { status: 404 }
      );
    }

    const [updatedRule] = await db
      .update(packingRules)
      .set({
        ruleText: body.ruleText ?? existing.ruleText,
        ruleType: body.ruleType ?? existing.ruleType,
        priority: body.priority ?? existing.priority,
        category: body.category ?? existing.category,
        isActive: body.isActive ?? existing.isActive,
        examples: body.examples ?? existing.examples,
        structuredRule: body.structuredRule ?? existing.structuredRule,
        updatedAt: new Date(),
      })
      .where(eq(packingRules.id, id))
      .returning();

    return NextResponse.json({ success: true, data: updatedRule });
  } catch (error) {
    console.error("Error updating packing rule:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update packing rule" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a packing rule
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if rule exists
    const [existing] = await db
      .select()
      .from(packingRules)
      .where(eq(packingRules.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Packing rule not found" },
        { status: 404 }
      );
    }

    await db.delete(packingRules).where(eq(packingRules.id, id));

    return NextResponse.json({
      success: true,
      message: "Packing rule deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting packing rule:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete packing rule" },
      { status: 500 }
    );
  }
}

