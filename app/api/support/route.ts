import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export interface SupportItem {
  id: string;
  source: "zenbank_question" | "ticket";
  type: "question_complaint" | "topic_request" | "general_support" | "tech_issue" | "billing";
  title: string;
  description: string;
  status: "open" | "resolved";
  createdAt: string;
  submitterName?: string;
  // Question specific fields
  questionId?: number;
  questionCode?: string;
  questionText?: string;
  options?: { id: string; text: string; isCorrect: boolean }[];
  correctAnswer?: string;
  explanation?: string;
  gradeLevel?: string;
  subject?: string;
  topic?: string;
  flagReason?: string | null;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filterType = searchParams.get("type"); // "all", "question_complaint", "topic_request", etc.
    const filterStatus = searchParams.get("status"); // "all", "open", "resolved"

    // 1. Fetch flagged questions from ZenBank's PostgreSQL database
    const flaggedQuestions = await prisma.question.findMany({
      where: {
        OR: [
          { status: "flagged" },
          { flagReason: { not: null } }
        ]
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
    });

    const questionItems: SupportItem[] = flaggedQuestions.map((q) => {
      const isOpen = q.status === "flagged";
      const rawOpts = Array.isArray(q.options)
        ? (q.options as any[]).map((o: any) => ({
            id: o.id || "A",
            text: o.text || String(o),
            isCorrect: Boolean(o.isCorrect || o.id === q.correctAnswer || o.text === q.correctAnswer),
          }))
        : [];

      return {
        id: `zb-q-${q.id}`,
        source: "zenbank_question",
        type: "question_complaint",
        title: `Question Issue (ID: zb-${q.id})`,
        description: q.flagReason || "Student flagged this question as incorrect or confusing.",
        status: isOpen ? "open" : "resolved",
        createdAt: q.updatedAt.toISOString(),
        submitterName: "Student Reporter",
        questionId: Number(q.id),
        questionCode: `zb-${q.id}`,
        questionText: q.questionText,
        options: rawOpts,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        gradeLevel: q.gradeLevel,
        subject: q.subject,
        topic: q.topic,
        flagReason: q.flagReason,
      };
    });

    // 2. Fetch external tickets from My Zen Learning if available
    let externalTickets: SupportItem[] = [];
    const myZenUrl = (
      process.env.MYZENLEARNING_INTERNAL_URL ||
      process.env.NEXT_PUBLIC_MYZENLEARNING_URL ||
      process.env.MYZENLEARNING_URL ||
      "https://web-production-9743c.up.railway.app"
    ).replace(/\/+$/, "");

    try {
      const res = await fetch(`${myZenUrl}/api/tickets`, {
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.tickets)) {
          externalTickets = data.tickets.map((t: any) => {
            let mappedType: SupportItem["type"] = "general_support";
            if (t.type === "question_error") mappedType = "question_complaint";
            else if (t.type === "topic_request") mappedType = "topic_request";
            else if (t.type === "tech_issue") mappedType = "tech_issue";
            else if (t.type === "billing") mappedType = "billing";

            // Only extract numeric questionId if it is a pure integer or zb- prefixed
            let zbNumericId: number | undefined = undefined;
            if (t.questionId) {
              const strQ = String(t.questionId);
              if (strQ.startsWith("zb-") || /^\d+$/.test(strQ)) {
                const parsed = parseInt(strQ.replace(/\D/g, ""), 10);
                if (!isNaN(parsed)) zbNumericId = parsed;
              }
            }

            const rawOptions = Array.isArray(t.options)
              ? t.options.map((o: any, idx: number) => {
                  if (typeof o === "object" && o !== null) {
                    return {
                      id: o.id || String.fromCharCode(65 + idx),
                      text: o.text || String(o),
                      isCorrect: Boolean(o.isCorrect || o.text === t.correctAnswer || o.id === t.correctAnswer),
                    };
                  }
                  const optId = String.fromCharCode(65 + idx);
                  return {
                    id: optId,
                    text: String(o),
                    isCorrect: String(o) === t.correctAnswer || optId === t.correctAnswer,
                  };
                })
              : [];

            return {
              id: t.id || `tck-${Date.now()}`,
              source: "ticket",
              type: mappedType,
              title: t.title || `Ticket ${t.ticketNumber || ""}`,
              description: t.description || "",
              status: t.status === "resolved" ? "resolved" : "open",
              createdAt: t.createdAt || new Date().toISOString(),
              submitterName: t.submitterName || "User",
              questionId: zbNumericId,
              questionCode: t.questionId ? String(t.questionId) : undefined,
              questionText: t.questionText,
              options: rawOptions,
              correctAnswer: t.correctAnswer,
              explanation: t.explanation,
              gradeLevel: t.gradeLevel,
              subject: t.subject,
              topic: t.quizTitle || t.topic,
            };
          });
        }
      }
    } catch {
      // Graceful fallback if MyZenLearning server is not directly reachable
    }

    // Deduplicate: If an external ticket refers to a question already in questionItems, don't duplicate
    const existingQIds = new Set(questionItems.map((q) => q.questionId).filter(Boolean));
    const nonDuplicateTickets = externalTickets.filter((t) => {
      if (t.type === "question_complaint" && t.questionId && existingQIds.has(t.questionId)) {
        return false;
      }
      return true;
    });

    let allItems: SupportItem[] = [...questionItems, ...nonDuplicateTickets];

    // Compute metrics before filtering
    const counts = {
      total: allItems.length,
      open: allItems.filter((i) => i.status === "open").length,
      resolved: allItems.filter((i) => i.status === "resolved").length,
      questionComplaints: allItems.filter((i) => i.type === "question_complaint" && i.status === "open").length,
      topicRequests: allItems.filter((i) => i.type === "topic_request" && i.status === "open").length,
      generalSupport: allItems.filter((i) => i.type === "general_support" && i.status === "open").length,
    };

    // Apply filtering
    if (filterStatus && filterStatus !== "all") {
      allItems = allItems.filter((i) => i.status === filterStatus);
    }
    if (filterType && filterType !== "all") {
      allItems = allItems.filter((i) => i.type === filterType);
    }

    return NextResponse.json(
      {
        success: true,
        items: allItems,
        counts,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Failed to fetch support items:", error);
    return NextResponse.json(
      { error: "Failed to fetch support items" },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      id, 
      source,
      action, 
      questionId, 
      questionCode,
      options, 
      correctAnswer, 
      questionText, 
      explanation 
    } = body;

    const myZenUrl = (
      process.env.MYZENLEARNING_INTERNAL_URL ||
      process.env.NEXT_PUBLIC_MYZENLEARNING_URL ||
      process.env.MYZENLEARNING_URL ||
      "https://web-production-9743c.up.railway.app"
    ).replace(/\/+$/, "");

    // 1. Forward updates to MyZenLearning if it's a ticket
    if (id?.startsWith("tck-") || source === "ticket") {
      try {
        const ticketRes = await fetch(`${myZenUrl}/api/tickets`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ticketId: id,
            status: action === "resolve" ? "resolved" : action === "reopen" ? "open" : undefined,
            questionId: questionCode || questionId,
            questionText,
            options,
            correctAnswer,
            explanation,
          }),
        });
        if (!ticketRes.ok) {
          console.warn("MyZenLearning ticket patch returned status:", ticketRes.status);
        }
      } catch (fwdErr) {
        console.error("Failed to forward patch to MyZenLearning:", fwdErr);
      }
    }

    // 2. If it is also or purely a ZenBank database question
    const isZenBankQ = id?.startsWith("zb-q-") || (typeof questionId === "number" && !isNaN(questionId));
    if (isZenBankQ) {
      const numericId = typeof questionId === "number" ? questionId : parseInt(id.replace("zb-q-", ""), 10);
      if (!isNaN(numericId)) {
        try {
          const updateData: Record<string, any> = {};
          if (action === "resolve") {
            updateData.status = "verified";
            updateData.verifiedAt = new Date();
            updateData.verifiedBy = "Support Lead";
          } else if (action === "reopen") {
            updateData.status = "flagged";
          }

          if (options) updateData.options = options;
          if (correctAnswer) updateData.correctAnswer = correctAnswer;
          if (questionText) updateData.questionText = questionText;
          if (explanation) updateData.explanation = explanation;

          await prisma.question.update({
            where: { id: BigInt(numericId) },
            data: updateData,
          });
        } catch (dbErr) {
          console.warn("Could not update ZenBank question in database:", dbErr);
        }
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: action === "resolve" ? "Marked as resolved successfully!" : "Updated successfully!",
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Failed to update support item:", error);
    return NextResponse.json(
      { error: "Failed to update support item" },
      { status: 500, headers: corsHeaders }
    );
  }
}
