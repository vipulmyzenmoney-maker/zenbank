import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export interface TopicInventoryRow {
  gradeLevel: string;
  subject: string;
  topic: string;
  totalQuestions: number;
  liveOnZenLearning: number; // status = 'verified'
  inDraftReview: number;    // status = 'draft'
  flagged: number;          // status = 'flagged'
  difficulty: {
    easy: number;
    medium: number;
    hard: number;
  };
  lastAddedAt: string | null;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filterGrade = searchParams.get("grade");
    const filterSubject = searchParams.get("subject");

    // Fetch questions with relevant inventory fields
    const questions = await prisma.question.findMany({
      where: {
        ...(filterGrade && filterGrade !== "all" ? { gradeLevel: filterGrade } : {}),
        ...(filterSubject && filterSubject !== "all" ? { subject: filterSubject } : {}),
      },
      select: {
        id: true,
        gradeLevel: true,
        subject: true,
        topic: true,
        difficulty: true,
        status: true,
        createdAt: true,
      },
      orderBy: [{ gradeLevel: "asc" }, { subject: "asc" }, { topic: "asc" }],
    });

    // Group questions by Grade -> Subject -> Topic
    const topicMap = new Map<string, TopicInventoryRow>();
    const gradesSet = new Set<string>();
    const subjectsSet = new Set<string>();

    let totalLive = 0;
    let totalDraft = 0;
    let totalFlagged = 0;

    for (const q of questions) {
      const grade = (q.gradeLevel || "5th Grade").trim();
      const subj = (q.subject || "General").trim();
      const topic = (q.topic || "General Concepts").trim();
      const diff = (q.difficulty || "medium").toLowerCase();
      const status = (q.status || "draft").toLowerCase();

      gradesSet.add(grade);
      subjectsSet.add(subj);

      if (status === "verified") totalLive++;
      else if (status === "draft") totalDraft++;
      else if (status === "flagged") totalFlagged++;

      const key = `${grade}:::${subj}:::${topic}`;
      let row = topicMap.get(key);

      if (!row) {
        row = {
          gradeLevel: grade,
          subject: subj,
          topic: topic,
          totalQuestions: 0,
          liveOnZenLearning: 0,
          inDraftReview: 0,
          flagged: 0,
          difficulty: { easy: 0, medium: 0, hard: 0 },
          lastAddedAt: q.createdAt ? q.createdAt.toISOString() : null,
        };
        topicMap.set(key, row);
      }

      row.totalQuestions++;
      if (status === "verified") row.liveOnZenLearning++;
      else if (status === "draft") row.inDraftReview++;
      else if (status === "flagged") row.flagged++;

      if (diff === "easy") row.difficulty.easy++;
      else if (diff === "hard") row.difficulty.hard++;
      else row.difficulty.medium++;

      if (q.createdAt && (!row.lastAddedAt || new Date(q.createdAt) > new Date(row.lastAddedAt))) {
        row.lastAddedAt = q.createdAt.toISOString();
      }
    }

    const inventory: TopicInventoryRow[] = Array.from(topicMap.values());

    return NextResponse.json(
      {
        success: true,
        summary: {
          totalQuestions: questions.length,
          totalLiveOnZenLearning: totalLive,
          totalInDraftReview: totalDraft,
          totalFlagged: totalFlagged,
          totalTopics: inventory.length,
          totalGrades: gradesSet.size,
          totalSubjects: subjectsSet.size,
          grades: Array.from(gradesSet),
          subjects: Array.from(subjectsSet),
        },
        inventory,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Failed to fetch curriculum inventory:", error);
    return NextResponse.json(
      { error: "Failed to fetch curriculum inventory" },
      { status: 500, headers: corsHeaders }
    );
  }
}
