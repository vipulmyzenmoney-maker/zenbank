import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { groq, GENERATION_MODEL } from "@/lib/groq";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, gradeLevel, subject, topics, count = 10 } = body;

    if (!title || !gradeLevel || !subject || !topics?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Create SyllabusPack
    const pack = await prisma.syllabusPack.create({
      data: { title, gradeLevel, subject, topics },
    });

    // 2. Generate questions for each topic via Groq
    let totalGenerated = 0;

    for (const topic of topics as string[]) {
      const prompt = `You are an expert K-12 educator. Generate exactly ${count} multiple-choice questions for:
- Grade Level: ${gradeLevel}
- Subject: ${subject}
- Topic: ${topic}

For each question, provide:
1. A clear question text
2. Exactly 4 options (A, B, C, D) with exactly one correct answer
3. The letter of the correct answer
4. A concise but educational step-by-step explanation
5. Difficulty level (easy, medium, or hard)
6. A confidence score from 70-100 rating how certain you are the answer is correct

Return ONLY valid JSON in this exact format with no extra text:
{
  "questions": [
    {
      "questionText": "...",
      "options": [
        {"id": "A", "text": "...", "isCorrect": false},
        {"id": "B", "text": "...", "isCorrect": true},
        {"id": "C", "text": "...", "isCorrect": false},
        {"id": "D", "text": "...", "isCorrect": false}
      ],
      "correctAnswer": "B",
      "explanation": "...",
      "difficulty": "medium",
      "confidence": 95
    }
  ]
}`;

      try {
        const completion = await groq.chat.completions.create({
          model: GENERATION_MODEL,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
          max_tokens: 8000,
          response_format: { type: "json_object" },
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) continue;

        const parsed = JSON.parse(content);
        const questions = parsed.questions || [];

        // 3. Bulk insert into database
        for (const q of questions) {
          await prisma.question.create({
            data: {
              syllabusPackId: pack.id,
              questionText: q.questionText,
              options: q.options,
              correctAnswer: q.correctAnswer,
              explanation: q.explanation,
              gradeLevel,
              subject,
              topic,
              difficulty: q.difficulty || "medium",
              confidence: q.confidence || 90,
              status: "draft",
            },
          });
          totalGenerated++;
        }
      } catch (genError) {
        console.error(`Failed to generate for topic "${topic}":`, genError);
        // Continue with other topics
      }
    }

    return NextResponse.json({
      success: true,
      packId: Number(pack.id),
      questionsGenerated: totalGenerated,
    });
  } catch (error) {
    console.error("Generation error:", error);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
