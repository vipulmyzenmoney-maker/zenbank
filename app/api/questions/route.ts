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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "100", 10);

    const where: Record<string, unknown> = {};
    if (status && status !== "all") where.status = status;
    if (search) {
      where.questionText = { contains: search, mode: "insensitive" };
    }

    const [questions, total, drafts, verified, flagged] = await Promise.all([
      prisma.question.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.question.count(),
      prisma.question.count({ where: { status: "draft" } }),
      prisma.question.count({ where: { status: "verified" } }),
      prisma.question.count({ where: { status: "flagged" } }),
    ]);

    return NextResponse.json(
      {
        questions: questions.map((q) => ({
          ...q,
          id: Number(q.id),
          syllabusPackId: q.syllabusPackId ? Number(q.syllabusPackId) : null,
        })),
        stats: { total, drafts, verified, flagged },
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Questions fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch questions" },
      { status: 500, headers: corsHeaders }
    );
  }
}
