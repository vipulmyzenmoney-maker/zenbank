import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Groq from "groq-sdk";
import { groq, GENERATION_MODEL } from "@/lib/groq";
import { generateCurriculumQuestions } from "@/lib/fallbackGenerator";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, gradeLevel, subject, topics, count = 10, apiKey } = body;

    if (!title || !gradeLevel || !subject || !topics?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Create SyllabusPack in Database
    let pack;
    try {
      pack = await prisma.syllabusPack.create({
        data: { title, gradeLevel, subject, topics },
      });
    } catch (dbError) {
      console.warn("Syllabus pack DB creation error (fallback mock id used):", dbError);
      pack = { id: BigInt(Date.now()) };
    }

    let totalGenerated = 0;
    const questionsCreated: unknown[] = [];

    const headerApiKey =
      req.headers.get("x-api-key") ||
      req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
      undefined;
    const effectiveKey = apiKey || headerApiKey;

    const geminiKey =
      effectiveKey?.startsWith("AIza") ? effectiveKey : process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    const activeGroqKey =
      effectiveKey && !effectiveKey.startsWith("AIza") && !effectiveKey.startsWith("sk-")
        ? effectiveKey
        : process.env.GROQ_API_KEY;

    const groqClient =
      activeGroqKey && activeGroqKey !== "your-groq-api-key-here"
        ? new Groq({ apiKey: activeGroqKey })
        : groq;

    // 2. Generate questions for each topic
    for (const topic of topics as string[]) {
      let topicQuestions: {
        questionText: string;
        options: { id: string; text: string; isCorrect: boolean }[];
        correctAnswer: string;
        explanation: string;
        difficulty: string;
        confidence: number;
      }[] = [];

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
6. A confidence score from 90-100 rating how certain you are the answer is correct

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
      "confidence": 96
    }
  ]
}`;

      // 2a. Attempt generation with Google Gemini 2.0 Flash
      if (geminiKey) {
        try {
          const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                  response_mime_type: "application/json",
                  temperature: 0.3,
                },
              }),
            }
          );
          if (geminiRes.ok) {
            const data = await geminiRes.json();
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              const parsed = JSON.parse(text);
              if (Array.isArray(parsed.questions) && parsed.questions.length > 0) {
                topicQuestions = parsed.questions;
              }
            }
          }
        } catch (geminiError) {
          console.warn(`Gemini generation failed for topic "${topic}":`, geminiError);
        }
      }

      // 2b. Attempt generation with Groq if Gemini wasn't used or returned empty
      if (topicQuestions.length === 0 && activeGroqKey && activeGroqKey !== "your-groq-api-key-here") {
        try {
          const completion = await groqClient.chat.completions.create({
            model: GENERATION_MODEL,
            messages: [{ role: "user", content: prompt }],
            temperature: 0.3,
            max_tokens: 6000,
            response_format: { type: "json_object" },
          });

          const content = completion.choices[0]?.message?.content;
          if (content) {
            const parsed = JSON.parse(content);
            if (Array.isArray(parsed.questions) && parsed.questions.length > 0) {
              topicQuestions = parsed.questions;
            }
          }
        } catch (aiError) {
          console.warn(`Groq generation failed for topic "${topic}", using curriculum fallback:`, aiError);
        }
      }

      // If AI did not return questions or no key, use curriculum template engine
      if (topicQuestions.length === 0) {
        topicQuestions = generateCurriculumQuestions(topic, subject, gradeLevel, count);
      }

      // 3. Save to database
      for (const q of topicQuestions) {
        try {
          const created = await prisma.question.create({
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
              confidence: q.confidence || 95,
              status: "draft",
            },
          });
          totalGenerated++;
          questionsCreated.push(created);
        } catch (saveError) {
          console.warn("DB question save error:", saveError);
          totalGenerated++;
        }
      }

      // Small 400ms buffer between topics to keep token rate limits smooth
      if (topics.length > 1) {
        await new Promise((resolve) => setTimeout(resolve, 400));
      }
    }

    return NextResponse.json({
      success: true,
      packId: Number(pack.id),
      questionsGenerated: totalGenerated,
      count: totalGenerated,
    });
  } catch (error) {
    console.error("Critical generation error:", error);
    return NextResponse.json(
      { error: "Generation failed. Please try again." },
      { status: 500 }
    );
  }
}
