import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    let verifiedBy = "AI Auto-Verifier";
    try {
      const body = await req.json();
      if (body?.verifiedBy) verifiedBy = body.verifiedBy;
    } catch {
      // JSON body might be empty, use default
    }

    const result = await prisma.question.updateMany({
      where: {
        status: "draft",
        confidence: { gte: 95 },
      },
      data: {
        status: "verified",
        verifiedAt: new Date(),
        verifiedBy,
      },
    });

    return NextResponse.json({
      success: true,
      approvedCount: result.count,
    });
  } catch (error) {
    console.error("Batch approve error:", error);
    return NextResponse.json({ error: "Batch approve failed" }, { status: 500 });
  }
}
