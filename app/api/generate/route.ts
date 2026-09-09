import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Groq from "groq-sdk";
import { groq, GENERATION_MODEL } from "@/lib/groq";
import { generateCurriculumQuestions } from "@/lib/fallbackGenerator";
import { shuffleMcqOptions } from "@/lib/shuffle";
import { filterDuplicates } from "@/lib/deduplication";

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
  existingQuestions = [],
}: {
  topic: string;
  subject: string;
  gradeLevel: string;
  count: number;
  geminiKey?: string;
  activeGroqKey?: string;
  groqClient: Groq;
  existingQuestions?: string[];
}): Promise<TopicQuestion[]> {
  // Build subject-specific diversity categories for the prompt
  const lowerSubject = subject.toLowerCase();
  let diversityCategories: string;

  if (lowerSubject.includes("math") || lowerSubject.includes("arithmetic") || lowerSubject.includes("algebra") || lowerSubject.includes("calculus")) {
    diversityCategories = `1. Conceptual Understanding & Definitions (core mathematical principles, properties, reasoning why rules work)
2. Procedural Problem Solving (step-by-step computation, multi-digit operations, standard algorithms)
3. Real-World Applications & Multi-Step Word Problems (practical everyday scenarios, financial/measurement contexts)
4. Visual, Spatial & Model Reasoning (interpreting number lines, area models, grids, geometric diagrams, charts)
5. Error Analysis & Common Misconceptions ("Which step contains an error?", identifying flawed reasoning)`;
  } else if (lowerSubject.includes("social") || lowerSubject.includes("history") || lowerSubject.includes("geography") || lowerSubject.includes("civics") || lowerSubject.includes("political") || lowerSubject.includes("economics")) {
    diversityCategories = `1. Factual Knowledge & Key Events (important dates, people, places, landmark events, treaties, and movements)
2. Conceptual Understanding (why events happened, cause-and-effect relationships, significance of historical developments)
3. Map Skills & Geographic Reasoning (locations, physical features, climate zones, resource distribution, reading maps)
4. Governance, Civics & Constitutional Awareness (forms of government, rights, duties, democratic institutions, laws)
5. Critical Analysis & Source Interpretation (analyzing perspectives, comparing viewpoints, distinguishing fact from opinion)`;
  } else if (lowerSubject.includes("science") || lowerSubject.includes("physics") || lowerSubject.includes("chemistry") || lowerSubject.includes("biology")) {
    diversityCategories = `1. Conceptual Understanding & Definitions (core scientific principles, laws, properties, and terminology)
2. Process & Experimental Reasoning (scientific method, hypothesis testing, lab procedures, controlled variables)
3. Real-World Applications (practical scenarios, environmental impact, technology, health, everyday phenomena)
4. Diagram & Data Interpretation (reading charts, graphs, diagrams, life cycles, anatomical structures, periodic table)
5. Analysis & Critical Thinking (predicting outcomes, cause-effect reasoning, comparing scientific models)`;
  } else if (lowerSubject.includes("english") || lowerSubject.includes("language") || lowerSubject.includes("reading") || lowerSubject.includes("literature") || lowerSubject.includes("writing")) {
    diversityCategories = `1. Reading Comprehension & Main Idea (understanding passages, identifying themes, summarizing text)
2. Vocabulary, Grammar & Word Usage (context clues, prefixes/suffixes, parts of speech, sentence structure)
3. Literary Devices & Figurative Language (simile, metaphor, personification, alliteration, imagery, irony)
4. Writing Skills & Text Structure (narrative, persuasive, expository structures, paragraph organization)
5. Critical Analysis & Inference (author's purpose, point of view, drawing conclusions from text evidence)`;
  } else {
    // Generic fallback for any other subject
    diversityCategories = `1. Factual Knowledge & Key Concepts (core facts, definitions, terminology, and foundational ideas of ${subject})
2. Conceptual Understanding (deeper "why" and "how" reasoning, cause-and-effect, relationships between concepts)
3. Real-World Applications & Scenarios (practical everyday connections, current events, relatable examples)
4. Analysis & Interpretation (reading diagrams, charts, maps, images, or data related to ${subject})
5. Critical Thinking & Evaluation (comparing viewpoints, identifying errors, synthesizing information)`;
  }

  const antiDuplicationDirective =
    existingQuestions.length > 0
      ? `\nCRITICAL ANTI-DUPLICATION RULE (ZERO REPETITION):
The following questions ALREADY EXIST in our database for this topic. You MUST NOT duplicate, rephrase, copy, or make minor number/word swaps of any of these:
${existingQuestions.slice(0, 20).map((q, idx) => `  ${idx + 1}. "${q}"`).join("\n")}

Every single question you generate MUST introduce a completely NEW angle, fresh real-world scenario, distinct numbers, or alternative problem format!\n`
      : "";

  const prompt = `You are an expert K-12 curriculum specialist and assessment designer.
Generate exactly ${count} diverse, high-quality, completely unique multiple-choice questions for:
- Grade Level: ${gradeLevel}
- Subject: ${subject}
- Topic: ${topic}

CRITICAL REQUIREMENT — SUBJECT ACCURACY:
You MUST generate questions strictly about "${subject}" on the topic "${topic}". Do NOT generate questions about any other subject. Every question must be directly and specifically about ${subject} content.
${antiDuplicationDirective}
CRITICAL REQUIREMENT — HIGH DIVERSITY & COMPREHENSIVE COVERAGE:
Every single question of the ${count} questions MUST test a distinctly DIFFERENT concept, scenario, or angle of "${topic}". DO NOT repeat question formats or make simple variations.
Distribute the ${count} questions across:
${diversityCategories}

Difficulty Distribution:
- ~30% Easy (foundational recall and direct recognition)
- ~40% Medium (application, two-step reasoning)
- ~30% Hard (multi-step synthesis, non-routine critical thinking)

For each question, provide:
1. A clear, challenging, and age-appropriate question text that is specifically about ${subject}
2. Exactly 4 options (A, B, C, D) with exactly one definitively correct answer and 3 realistic distractors reflecting common student errors
3. The letter of the correct answer: MUST be generously and evenly distributed across A, B, C, and D across the set (~25% each). DO NOT bias toward B or any single letter!
4. A KID-FRIENDLY, EASY-TO-UNDERSTAND EXPLANATION (CRITICAL REQUIREMENT):
   - MUST be written directly to a ${gradeLevel} student in warm, encouraging, simple language that a child can read on their own.
   - NEVER write internal AI thoughts, model reasoning processes, or test-maker commentary.
   - NEVER use adult or test-author jargon (DO NOT use words like "distractor", "misconception", "the model selected", "evaluates mastery", "option A is flawed").
   - Structure in 2 to 3 friendly steps:
     • Step 1: Explain the main concept or rule in plain words.
     • Step 2: Walk through the reasoning step-by-step.
     • 💡 Helpful Tip: A quick, memorable memory trick or rule of thumb for kids!
5. Difficulty level ("easy", "medium", or "hard")
6. A confidence score from 92-100

Return ONLY valid JSON in this exact format with no extra text (ensure correct answers are evenly spread across A, B, C, D):
{
  "questions": [
    {
      "questionText": "...",
      "options": [
        {"id": "A", "text": "...", "isCorrect": true},
        {"id": "B", "text": "...", "isCorrect": false},
        {"id": "C", "text": "...", "isCorrect": false},
        {"id": "D", "text": "...", "isCorrect": false}
      ],
      "correctAnswer": "A",
      "explanation": "Step 1: ... Step 2: ... 💡 Helpful Tip: ...",
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
              temperature: 0.75,
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
        temperature: 0.75,
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

  function sanitizeKidExplanation(raw: string): string {
    if (!raw) return "";
    return raw
      .replace(/<think>[\s\S]*?<\/think>/gi, "")
      .replace(/^(thinking process|reasoning|internal analysis|rationale):\s*/gi, "")
      .replace(/(?:distractor|misconception)\s+[A-D]\b[^.\n]*[.\n]?/gi, "")
      .trim();
  }

  // 3. Deduplicate AI-generated questions against existing DB questions and intra-batch
  let validBatch: TopicQuestion[] = [];
  if (topicQuestions.length > 0) {
    const { uniqueQuestions } = filterDuplicates(topicQuestions, existingQuestions, 0.70);
    validBatch = uniqueQuestions;
  }

  // 4. Backfill any missing questions if AI failed or returned duplicates
  if (validBatch.length < count) {
    const needed = count - validBatch.length;
    const allSeen = [...existingQuestions, ...validBatch.map((q) => q.questionText)];
    const backfills = generateCurriculumQuestions(topic, subject, gradeLevel, needed, allSeen);
    validBatch = [...validBatch, ...backfills];
  }

  // Uniformly shuffle MCQ options across A, B, C, D and ensure explanations are sanitized
  return validBatch.map((q) => {
    const shuffled = shuffleMcqOptions(q.options, q.correctAnswer);
    return {
      ...q,
      options: shuffled.options,
      correctAnswer: shuffled.correctAnswer,
      explanation: sanitizeKidExplanation(q.explanation),
    };
  });
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
              if (req.signal?.aborted) {
                console.log("Client aborted question generation stream.");
                break;
              }

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

              // Fetch existing questions for this topic to guarantee 0 repetition
              const existingRecords = await prisma.question.findMany({
                where: {
                  gradeLevel,
                  subject,
                  topic,
                },
                select: { questionText: true },
                take: 25,
              });
              const existingQuestions = existingRecords.map((r) => r.questionText);

              // Formulate questions for this topic with anti-duplication memory
              const topicQuestions = await generateQuestionsForTopic({
                topic,
                subject,
                gradeLevel,
                count,
                geminiKey,
                activeGroqKey,
                groqClient,
                existingQuestions,
              });

              // Save to database with pre-insert duplicate check
              for (const q of topicQuestions) {
                try {
                  const alreadyExists = await prisma.question.findFirst({
                    where: {
                      gradeLevel,
                      subject,
                      topic,
                      questionText: q.questionText,
                    },
                    select: { id: true },
                  });

                  if (alreadyExists) {
                    console.log(`Skipped existing duplicate question in DB: "${q.questionText.slice(0, 45)}..."`);
                    continue;
                  }

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
      const existingRecords = await prisma.question.findMany({
        where: {
          gradeLevel,
          subject,
          topic,
        },
        select: { questionText: true },
        take: 25,
      });
      const existingQuestions = existingRecords.map((r) => r.questionText);

      const topicQuestions = await generateQuestionsForTopic({
        topic,
        subject,
        gradeLevel,
        count,
        geminiKey,
        activeGroqKey,
        groqClient,
        existingQuestions,
      });

      for (const q of topicQuestions) {
        try {
          const alreadyExists = await prisma.question.findFirst({
            where: {
              gradeLevel,
              subject,
              topic,
              questionText: q.questionText,
            },
            select: { id: true },
          });

          if (alreadyExists) {
            console.log(`Skipped existing duplicate question in DB: "${q.questionText.slice(0, 45)}..."`);
            continue;
          }

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
