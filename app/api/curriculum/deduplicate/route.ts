import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeQuestionText } from "@/lib/deduplication";

export const dynamic = "force-dynamic";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    const allQuestions = await prisma.question.findMany({
      select: {
        id: true,
        questionText: true,
        gradeLevel: true,
        subject: true,
        topic: true,
        status: true,
        confidence: true,
        createdAt: true,
      },
    });

    // Group questions by normalized text within the same grade, subject, and topic
    const groups = new Map<string, typeof allQuestions>();

    for (const q of allQuestions) {
      const normText = normalizeQuestionText(q.questionText);
      const groupKey = `${q.gradeLevel.trim().toLowerCase()}::${q.subject.trim().toLowerCase()}::${q.topic.trim().toLowerCase()}::${normText}`;

      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(q);
    }

    const idsToDelete: bigint[] = [];
    let duplicateGroupsCount = 0;

    for (const [key, items] of groups.entries()) {
      if (items.length > 1) {
        duplicateGroupsCount++;
        // Sort: verified first, then highest confidence, then earliest created (lowest id)
        items.sort((a, b) => {
          if (a.status === "verified" && b.status !== "verified") return -1;
          if (b.status === "verified" && a.status !== "verified") return 1;
          if (b.confidence !== a.confidence) return b.confidence - a.confidence;
          return Number(a.id - b.id);
        });

        // The first item is our primary survivor; delete the rest
        const toDelete = items.slice(1);
        for (const item of toDelete) {
          idsToDelete.push(item.id);
        }
      }
    }

    let deletedCount = 0;
    if (idsToDelete.length > 0) {
      // 1. Delete any associated question_analytics first to avoid FK violations
      try {
        await prisma.questionAnalytics.deleteMany({
          where: { questionId: { in: idsToDelete } },
        });
      } catch (analyticsErr) {
        console.warn("Analytics deletion warning:", analyticsErr);
      }

      // 2. Delete duplicate question rows
      const deleteResult = await prisma.question.deleteMany({
        where: { id: { in: idsToDelete } },
      });
      deletedCount = deleteResult.count;
    }

    return NextResponse.json(
      {
        success: true,
        message: `Successfully resolved ${duplicateGroupsCount} duplicate groups and removed ${deletedCount} redundant question rows.`,
        totalScanned: allQuestions.length,
        duplicateGroups: duplicateGroupsCount,
        deletedCount,
        retainedCount: allQuestions.length - deletedCount,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Deduplication error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to run deduplication.",
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
