import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, flagReason, questionText, explanation } = body;

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (flagReason !== undefined) updateData.flagReason = flagReason;
    if (questionText) updateData.questionText = questionText;
    if (explanation) updateData.explanation = explanation;
    if (status === "verified") updateData.verifiedAt = new Date();

    const question = await prisma.question.update({
      where: { id: BigInt(id) },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      question: {
        ...question,
        id: Number(question.id),
        syllabusPackId: question.syllabusPackId ? Number(question.syllabusPackId) : null,
      },
    });
  } catch (error) {
    console.error("Question update error:", error);
    return NextResponse.json({ error: "Failed to update question" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.question.delete({ where: { id: BigInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Question delete error:", error);
    return NextResponse.json({ error: "Failed to delete question" }, { status: 500 });
  }
}
