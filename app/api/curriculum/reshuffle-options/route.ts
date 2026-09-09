import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { shuffleMcqOptions } from "@/lib/shuffle";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function GET(req: NextRequest) {
  return handleReshuffle(req);
}

export async function POST(req: NextRequest) {
  return handleReshuffle(req);
}

async function handleReshuffle(req: NextRequest) {
  try {
    const questions = await prisma.question.findMany({
      select: {
        id: true,
        options: true,
        correctAnswer: true,
      },
    });

    const beforeDistribution: Record<string, number> = {};
    const afterDistribution: Record<string, number> = {};

    let updatedCount = 0;

    for (const q of questions) {
      const rawOptions = (Array.isArray(q.options) ? q.options : []) as {
        id?: string;
        text: string;
        isCorrect?: boolean;
      }[];

      beforeDistribution[q.correctAnswer] = (beforeDistribution[q.correctAnswer] || 0) + 1;

      if (rawOptions.length >= 2) {
        const shuffled = shuffleMcqOptions(rawOptions, q.correctAnswer);
        afterDistribution[shuffled.correctAnswer] = (afterDistribution[shuffled.correctAnswer] || 0) + 1;

        await prisma.question.update({
          where: { id: q.id },
          data: {
            options: shuffled.options as any,
            correctAnswer: shuffled.correctAnswer,
          },
        });
        updatedCount++;
      } else {
        afterDistribution[q.correctAnswer] = (afterDistribution[q.correctAnswer] || 0) + 1;
      }
    }

    return NextResponse.json(
      {
        success: true,
        totalQuestions: questions.length,
        updatedCount,
        beforeDistribution,
        afterDistribution,
        message: `Successfully reshuffled ${updatedCount} questions across A, B, C, and D evenly!`,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Failed to reshuffle MCQ options:", error);
    return NextResponse.json(
      {
        error: "Failed to reshuffle MCQ options",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
