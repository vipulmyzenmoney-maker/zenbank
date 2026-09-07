import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Groq from "groq-sdk";
import { groq, GENERATION_MODEL } from "@/lib/groq";
import { generateCurriculumQuestions } from "@/lib/fallbackGenerator";

export const dynamic = "force-dynamic";

interface TopicQuestion {
  questionText: string;
  options: { id: string; text: string; isCorrect: boolean }[];
  correctAnswer: string;
  explanation: string;
  difficulty: string;
  confidence: number;
}

async function generateQuestionsForTopic({
  topic,
  subject,
  gradeLevel,
  count,
  geminiKey,
  activeGroqKey,
  groqClient,
}: {
  topic: string;
  subject: string;
  gradeLevel: string;
  count: number;
  geminiKey?: string;
  activeGroqKey?: string;
  groqClient: Groq;
}): Promise<TopicQuestion[]> {
  const prompt = `You are an expert K-12 curriculum specialist and assessment designer.
Generate exactly ${count} diverse, high-quality multiple-choice questions for:
- Grade Level: ${gradeLevel}
- Subject: ${subject}
- Topic: ${topic}

CRITICAL REQUIREMENT - HIGH DIVERSITY & COMPREHENSIVE COVERAGE:
Every single question of the ${count} questions MUST test a distinctly DIFFERENT concept, scenario, or angle of "${topic}". DO NOT repeat question formats or make simple number variations.
Distribute the ${count} questions across:
1. Conceptual Understanding & Definitions (core mathematical/scientific principles, properties, reasoning why rules work)
2. Procedural Problem Solving (step-by-step computation, multi-digit operations, standard algorithms)
3. Real-World Applications & Multi-Step Word Problems (practical everyday scenarios, financial/measurement contexts)
4. Visual, Spatial & Model Reasoning (interpreting number lines, area models, grids, geometric diagrams, charts)
5. Error Analysis & Common Misconceptions ("Which step contains an error?", identifying flawed reasoning)

Difficulty Distribution:
- ~30% Easy (foundational recall and direct recognition)
- ~40% Medium (application, two-step problem solving)
- ~30% Hard (multi-step synthesis, non-routine critical thinking)

For each question, provide:
1. A clear, challenging, and age-appropriate question text
2. Exactly 4 options (A, B, C, D) with exactly one definitively correct answer and 3 realistic distractors reflecting common student errors
3. The letter of the correct answer (randomize between A, B, C, D)
4. A concise, step-by-step educational explanation explaining why the correct option is right and how to avoid the distractors
5. Difficulty level ("easy", "medium", or "hard")
6. A confidence score from 92-100

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

  let topicQuestions: TopicQuestion[] = [];

  // 1. Attempt generation with Google Gemini 2.0 Flash
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

  // 2. Attempt generation with Groq if Gemini wasn't used or returned empty
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

  // 3. If AI did not return questions or no key, use curriculum template engine
  if (topicQuestions.length === 0) {
    topicQuestions = generateCurriculumQuestions(topic, subject, gradeLevel, count);
  }

  return topicQuestions;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, gradeLevel, subject, topics, count = 10, apiKey, stream = true } = body;

    if (!title || !gradeLevel || !subject || !topics?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Create SyllabusPack in Database
    let pack: { id: bigint | number };
    try {
      pack = await prisma.syllabusPack.create({
        data: { title, gradeLevel, subject, topics },
      });
    } catch (dbError) {
      console.warn("Syllabus pack DB creation error (fallback mock id used):", dbError);
      pack = { id: BigInt(Date.now()) };
    }

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

    const totalTopics = (topics as string[]).length;
    const totalExpected = totalTopics * count;

    // STREAMING MODE: Send live progress events per topic
    if (stream) {
      const encoder = new TextEncoder();
      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            // Send initial metadata
            controller.enqueue(
              encoder.encode(
                JSON.stringify({
                  type: "init",
                  packId: Number(pack.id),
                  totalTopics,
                  topics,
                  countPerTopic: count,
                  totalExpected,
                }) + "\n"
              )
            );

            let totalGenerated = 0;

            for (let i = 0; i < totalTopics; i++) {
              const topic = topics[i];

              // Notify client which topic is now being generated
              controller.enqueue(
                encoder.encode(
                  JSON.stringify({
                    type: "topic_start",
                    topic,
                    topicIndex: i + 1,
                    totalTopics,
                    totalGenerated,
                    totalExpected,
                    percent: Math.round((totalGenerated / totalExpected) * 100),
                  }) + "\n"
                )
              );

              // Formulate questions for this topic
              const topicQuestions = await generateQuestionsForTopic({
                topic,
                subject,
                gradeLevel,
                count,
                geminiKey,
                activeGroqKey,
                groqClient,
              });

              // Save to database
              for (const q of topicQuestions) {
                try {
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
                      confidence: q.confidence || 95,
                      status: "draft",
                    },
                  });
                  totalGenerated++;
                } catch (saveError) {
                  console.warn("DB question save error:", saveError);
                  totalGenerated++;
                }
              }

              // Notify client that this topic is complete
              controller.enqueue(
                encoder.encode(
                  JSON.stringify({
                    type: "topic_done",
                    topic,
                    topicIndex: i + 1,
                    totalTopics,
                    questionsAdded: topicQuestions.length,
                    totalGenerated,
                    totalExpected,
                    percent: Math.round((totalGenerated / totalExpected) * 100),
                  }) + "\n"
                )
              );

              // Small 400ms buffer between topics to keep token rate limits smooth
              if (totalTopics > 1 && i < totalTopics - 1) {
                await new Promise((resolve) => setTimeout(resolve, 400));
              }
            }

            // Final completion message
            controller.enqueue(
              encoder.encode(
                JSON.stringify({
                  type: "complete",
                  success: true,
                  packId: Number(pack.id),
                  totalGenerated,
                  count: totalGenerated,
                  percent: 100,
                }) + "\n"
              )
            );
          } catch (streamError) {
            console.error("Stream generation error:", streamError);
            controller.enqueue(
              encoder.encode(
                JSON.stringify({
                  type: "error",
                  error: streamError instanceof Error ? streamError.message : "Generation failed.",
                }) + "\n"
              )
            );
          } finally {
            controller.close();
          }
        },
      });

      return new Response(readableStream, {
        headers: {
          "Content-Type": "application/x-ndjson",
          "Cache-Control": "no-cache, no-transform",
        },
      });
    }

    // NON-STREAMING FALLBACK
    let totalGenerated = 0;
    for (let i = 0; i < totalTopics; i++) {
      const topic = topics[i];
      const topicQuestions = await generateQuestionsForTopic({
        topic,
        subject,
        gradeLevel,
        count,
        geminiKey,
        activeGroqKey,
        groqClient,
      });

      for (const q of topicQuestions) {
        try {
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
              confidence: q.confidence || 95,
              status: "draft",
            },
          });
          totalGenerated++;
        } catch (saveError) {
          console.warn("DB question save error:", saveError);
          totalGenerated++;
        }
      }

      if (totalTopics > 1 && i < totalTopics - 1) {
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
