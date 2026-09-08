import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "DELETE, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { title, gradeLevel, subject } = body;

    const updateData: Record<string, unknown> = {};
    if (title && typeof title === "string") updateData.title = title.trim();
    if (gradeLevel && typeof gradeLevel === "string") updateData.gradeLevel = gradeLevel.trim();
    if (subject && typeof subject === "string") updateData.subject = subject.trim();

    const updated = await prisma.syllabusPack.update({
      where: { id: BigInt(id) },
      data: updateData,
    });

    return NextResponse.json(
      {
        success: true,
        batch: {
          id: Number(updated.id),
          title: updated.title,
          gradeLevel: updated.gradeLevel,
          subject: updated.subject,
        },
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Failed to update batch:", error);
    return NextResponse.json(
      { error: "Failed to update batch" },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const batchId = BigInt(id);

    // Delete all questions associated with this syllabusPackId first
    const deletedQuestions = await prisma.question.deleteMany({
      where: { syllabusPackId: batchId },
    });

    // Delete the syllabusPack record itself
    await prisma.syllabusPack.delete({
      where: { id: batchId },
    });

    return NextResponse.json(
      {
        success: true,
        batchId: Number(batchId),
        deletedQuestionsCount: deletedQuestions.count,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Failed to delete batch:", error);
    return NextResponse.json(
      { error: "Failed to delete batch" },
      { status: 500, headers: corsHeaders }
    );
  }
}
