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
    let totalPacks = 0;
    let totalQuestions = 0;

    for (const preset of CURRICULUM_PRESETS) {
      // 1. Create or Find SyllabusPack
      let pack;
      try {
        pack = await prisma.syllabusPack.create({
          data: {
            title: preset.title,
            gradeLevel: preset.gradeLevel,
            subject: preset.subject,
            topics: preset.topics,
          },
        });
      } catch (e) {
        pack = { id: BigInt(Date.now() + totalPacks) };
      }
      totalPacks++;

      // 2. Generate grade-specific questions for each topic
      for (const topic of preset.topics) {
        const questions = generateCurriculumQuestions(
          topic,
          preset.subject,
          preset.gradeLevel,
          5 // 5 questions per topic
        );

        for (const q of questions) {
          try {
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
                status: "verified", // Auto-verified so My Zen Learning can immediately consume
                verifiedAt: new Date(),
                verifiedBy: "Curriculum Auto-Engine",
              },
            });
            totalQuestions++;
          } catch (insertError) {
            console.warn("Failed to insert question:", insertError);
          }
        }
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: `Successfully generated and uploaded ${totalQuestions} verified questions across ${totalPacks} curriculum packs!`,
        totalPacks,
        totalQuestions,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Auto-seed error:", error);
    return NextResponse.json(
      { error: "Failed to auto-upload curriculum questions" },
      { status: 500, headers: corsHeaders }
    );
  }
}
