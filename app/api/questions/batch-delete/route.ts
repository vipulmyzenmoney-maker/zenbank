import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ids } = body; // array of number / BigInt IDs

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "No question IDs provided" },
        { status: 400, headers: corsHeaders }
      );
    }

    const bigIntIds = ids.map((id) => BigInt(id));

    const result = await prisma.question.deleteMany({
      where: {
        id: { in: bigIntIds },
      },
    });

    return NextResponse.json(
      {
        success: true,
        deletedCount: result.count,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Batch delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete questions" },
      { status: 500, headers: corsHeaders }
    );
  }
}
