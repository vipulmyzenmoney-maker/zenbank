import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function POST() {
  try {
    const deleted = await prisma.question.deleteMany({
      where: { status: "draft" },
    });

    return NextResponse.json(
      { success: true, deletedCount: deleted.count },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Purge drafts error:", error);
    return NextResponse.json(
      { error: "Failed to purge draft questions" },
      { status: 500, headers: corsHeaders }
    );
  }
}
