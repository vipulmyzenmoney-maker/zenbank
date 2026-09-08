import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function GET() {
  return handleCleanup();
}

export async function POST() {
  return handleCleanup();
}

async function handleCleanup() {
  try {
    // 1. Find all questions that contain "(Topic:"
    const dirtyQuestions = await prisma.question.findMany({
      where: {
        questionText: {
          contains: "(Topic:",
        },
      },
      select: {
        id: true,
        questionText: true,
        topic: true,
      },
    });

    let cleanedQuestionsCount = 0;

    for (const q of dirtyQuestions) {
      // Clean string: remove " (Topic: ...)" even if the topic contains nested parentheses like (x, y)
      const cleanText = q.questionText
        .replace(/\s*\(Topic:.*\)$/gi, "")
        .replace(/\s*\(Topic:[^)]+\)/gi, "")
        .trim();

      if (cleanText !== q.questionText) {
        await prisma.question.update({
          where: { id: q.id },
          data: { questionText: cleanText },
        });
        cleanedQuestionsCount++;
      }
    }

    // 2. Clean up SyllabusPack titles that start with "Custom: " or lack formatting
    const packs = await prisma.syllabusPack.findMany({
      select: {
        id: true,
        title: true,
        gradeLevel: true,
        subject: true,
      },
    });

    let updatedPacksCount = 0;

    for (const pack of packs) {
      let newTitle = pack.title;
      if (newTitle.startsWith("Custom: ")) {
        const topicPart = newTitle.replace(/^Custom:\s*/i, "").trim();
        newTitle = `${pack.gradeLevel} ${pack.subject} • Set ${pack.id}: ${topicPart}`;
      } else if (!newTitle.includes("•") && !newTitle.includes(":")) {
        newTitle = `${pack.gradeLevel} ${pack.subject} • ${pack.title}`;
      }

      if (newTitle !== pack.title) {
        await prisma.syllabusPack.update({
          where: { id: pack.id },
          data: { title: newTitle },
        });
        updatedPacksCount++;
      }
    }

    return NextResponse.json(
      {
        success: true,
        cleanedQuestionsCount,
        updatedPacksCount,
        totalDirtyFound: dirtyQuestions.length,
      },
      { headers: corsHeaders }
    );
  } catch (err) {
    console.error("Cleanup error:", err);
    return NextResponse.json(
      { error: "Failed to clean question and set names" },
      { status: 500, headers: corsHeaders }
    );
  }
}
