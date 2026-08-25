import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const result = await prisma.question.updateMany({
      where: {
        status: "draft",
        confidence: { gte: 95 },
      },
      data: {
        status: "verified",
        verifiedAt: new Date(),
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
