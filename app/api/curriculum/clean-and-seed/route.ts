import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CURRICULUM_PRESETS } from "@/lib/presets";
import { generateCurriculumQuestions } from "@/lib/fallbackGenerator";

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
    // 1. Wipe out old placeholder questions so no old repetitive calculations remain
    await prisma.question.deleteMany({});
    await prisma.syllabusPack.deleteMany({});

    let totalPacks = 0;
    let totalQuestions = 0;

    for (const preset of CURRICULUM_PRESETS) {
      // 2. Create SyllabusPack in Database
      const pack = await prisma.syllabusPack.create({
        data: {
          title: preset.title,
          gradeLevel: preset.gradeLevel,
          subject: preset.subject,
          topics: preset.topics,
        },
      });
      totalPacks++;

      // 3. Generate rich, distinct questions for each topic
      for (const topic of preset.topics) {
        const questions = generateCurriculumQuestions(
          topic,
          preset.subject,
          preset.gradeLevel,
          5
        );

        for (const q of questions) {
          await prisma.question.create({
            data: {
              syllabusPackId: pack.id,
              questionText: q.questionText,
              options: q.options,
              correctAnswer: q.correctAnswer,
              explanation: q.explanation,
              gradeLevel: preset.gradeLevel,
              subject: preset.subject,
              topic,
              difficulty: q.difficulty,
              confidence: q.confidence,
              status: "verified",
              verifiedAt: new Date(),
              verifiedBy: "ZenBank Standard Curriculum Engine",
            },
          });
          totalQuestions++;
        }
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: `Wiped old placeholder questions and created ${totalQuestions} fresh, standard-aligned questions across ${totalPacks} curriculum packs!`,
        totalPacks,
        totalQuestions,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Clean and seed error:", error);
    return NextResponse.json(
      { error: "Failed to clean and seed curriculum" },
      { status: 500, headers: corsHeaders }
    );
  }
}
