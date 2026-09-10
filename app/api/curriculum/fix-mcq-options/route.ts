import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { shuffleMcqOptions } from "@/lib/shuffle";

export const dynamic = "force-dynamic";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function GET(req: NextRequest) {
  return handleFixMcqOptions(req);
}

export async function POST(req: NextRequest) {
  return handleFixMcqOptions(req);
}

async function handleFixMcqOptions(req: NextRequest) {
  try {
    const allQuestions = await prisma.question.findMany({
      select: {
        id: true,
        questionText: true,
        options: true,
        correctAnswer: true,
        explanation: true,
        topic: true,
      },
    });

    const fixedList: { id: number; questionText: string; beforeCount: number; afterCount: number }[] = [];

    for (const q of allQuestions) {
      const rawOptions = (Array.isArray(q.options) ? q.options : []) as {
        id?: string;
        text: string;
        isCorrect?: boolean;
      }[];

      // Specific known edge cases for existing legacy draft items
      if (Number(q.id) === 6101 || q.questionText.includes("Body of Liberties require a public trial")) {
        // Option "protecting fairness" is the true correct answer
        const healed = shuffleMcqOptions(
          [
            { id: "A", text: "To ensure the accused can speak and evidence is heard, protecting fairness.", isCorrect: true },
            { id: "B", text: "To save time for the magistrates and judges.", isCorrect: false },
            { id: "C", text: "To allow the royal governor to decide guilt in secret.", isCorrect: false },
            { id: "D", text: "To speed up the collection of court fines and property taxes.", isCorrect: false },
          ],
          "To ensure the accused can speak and evidence is heard, protecting fairness."
        );

        await prisma.question.update({
          where: { id: q.id },
          data: {
            options: healed.options as any,
            correctAnswer: healed.correctAnswer,
            explanation:
              "Step 1: The Massachusetts Body of Liberties guaranteed due process for accused individuals. Step 2: A public trial ensured witnesses were heard and the community could verify that justice was fair. 💡 Tip: Due process means fair rules and open trials for everyone.",
          },
        });

        fixedList.push({ id: Number(q.id), questionText: q.questionText, beforeCount: rawOptions.length, afterCount: 4 });
        continue;
      }

      if (Number(q.id) === 6062 || (q.questionText.includes("William Bradford") && q.questionText.includes("terms"))) {
        const healed = shuffleMcqOptions(
          [
            { id: "A", text: "About 30 times (serving over 30 years as governor)", isCorrect: true },
            { id: "B", text: "Only 5 terms before stepping down permanently", isCorrect: false },
            { id: "C", text: "10 terms during the first decade only", isCorrect: false },
            { id: "D", text: "12 terms before moving to Massachusetts Bay Colony", isCorrect: false },
          ],
          "About 30 times"
        );

        await prisma.question.update({
          where: { id: q.id },
          data: {
            options: healed.options as any,
            correctAnswer: healed.correctAnswer,
            explanation:
              "Step 1: William Bradford was repeatedly re-elected by Plymouth freemen. Step 2: He served approximately 30 terms between 1621 and 1656, guiding the colony for over three decades. 💡 Tip: Bradford was Plymouth's longest-serving governor.",
          },
        });

        fixedList.push({ id: Number(q.id), questionText: q.questionText, beforeCount: rawOptions.length, afterCount: 4 });
        continue;
      }

      // General check: If any question does not have exactly 4 options
      if (rawOptions.length !== 4) {
        const healed = shuffleMcqOptions(rawOptions, q.correctAnswer);
        await prisma.question.update({
          where: { id: q.id },
          data: {
            options: healed.options as any,
            correctAnswer: healed.correctAnswer,
          },
        });

        fixedList.push({ id: Number(q.id), questionText: q.questionText, beforeCount: rawOptions.length, afterCount: 4 });
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: `Scanned ${allQuestions.length} questions. Fixed ${fixedList.length} question(s) to have exactly 4 options.`,
        fixedCount: fixedList.length,
        fixed: fixedList,
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error("Error fixing MCQ options:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fix MCQ options" },
      { status: 500, headers: corsHeaders }
    );
  }
}
