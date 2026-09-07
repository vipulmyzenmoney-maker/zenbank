import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function GET() {
  try {
    const packs = await prisma.syllabusPack.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        questions: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    const batches = packs.map((pack) => {
      const totalQuestions = pack.questions.length;
      const draftCount = pack.questions.filter((q) => q.status === "draft").length;
      const verifiedCount = pack.questions.filter((q) => q.status === "verified").length;
      const flaggedCount = pack.questions.filter((q) => q.status === "flagged").length;

      return {
        id: Number(pack.id),
        title: pack.title,
        gradeLevel: pack.gradeLevel,
        subject: pack.subject,
        topics: pack.topics,
        createdAt: pack.createdAt.toISOString(),
        totalQuestions,
        draftCount,
        verifiedCount,
        flaggedCount,
      };
    });

    return NextResponse.json(
      { success: true, batches },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Failed to fetch batches:", error);
    return NextResponse.json(
      { error: "Failed to fetch batches" },
      { status: 500, headers: corsHeaders }
    );
  }
}
