import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { groq, GENERATION_MODEL } from "@/lib/groq";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      questionText,
      correctAnswer,
      currentExplanation,
      gradeLevel = "5th Grade",
      subject = "Math",
      apiKey,
    } = body;

    if (!questionText) {
      return NextResponse.json(
        { error: "Question text is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    const headerApiKey =
      req.headers.get("x-api-key") ||
      req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
      apiKey ||
      process.env.GROQ_API_KEY ||
      "";

    const prompt = `You are an expert, encouraging elementary and middle school teacher.
Rewrite the explanation for this question so it is super easy, fun, and clear for a ${gradeLevel} student to understand.

Question: "${questionText}"
Correct Answer: "${correctAnswer}"
Current Draft/Technical Explanation: "${currentExplanation || "None provided"}"

CRITICAL REQUIREMENTS:
1. Write directly to a ${gradeLevel} student using friendly, encouraging, and simple words.
2. NO adult meta-analysis or test-maker jargon (NEVER use words like "distractor", "misconception", "the model thinks", "this evaluates", "option A is flawed").
3. Break it down into 2 clear steps:
   - Step 1: Explain the basic concept or rule in simple words with relatable examples or numbers.
   - Step 2: Show the step-by-step solution.
   - 💡 Helpful Tip: A quick memory trick or tip for kids.
4. Keep it concise (under 80 words total).

Return ONLY valid JSON in this format:
{
  "explanation": "Step 1: ... Step 2: ... 💡 Helpful Tip: ..."
}`;

    // 1. Try Gemini if GEMINI_API_KEY is available
    const geminiKey = process.env.GEMINI_API_KEY;
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
            if (parsed.explanation) {
              return NextResponse.json(
                { success: true, explanation: parsed.explanation },
                { headers: corsHeaders }
              );
            }
          }
        }
      } catch (geminiErr) {
        console.warn("Gemini simplify error:", geminiErr);
      }
    }

    // 2. Try Groq
    const activeGroqKey = headerApiKey.startsWith("gsk_")
      ? headerApiKey
      : process.env.GROQ_API_KEY;

    if (activeGroqKey) {
      const groqClient = new Groq({ apiKey: activeGroqKey });
      const completion = await groqClient.chat.completions.create({
        model: GENERATION_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        max_tokens: 500,
        response_format: { type: "json_object" },
      });

      const content = completion.choices[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content);
        if (parsed.explanation) {
          // Clean any potential reasoning residue
          const cleanExplanation = parsed.explanation
            .replace(/<think>[\s\S]*?<\/think>/gi, "")
            .trim();
          return NextResponse.json(
            { success: true, explanation: cleanExplanation },
            { headers: corsHeaders }
          );
        }
      }
    }

    // 3. Fallback kid-friendly explanation
    return NextResponse.json(
      {
        success: true,
        explanation: `Step 1: Look at what the question asks and find the key numbers. Step 2: The correct answer is ${correctAnswer}. 💡 Helpful Tip: Always double check your work by reading the question one more time!`,
      },
      { headers: corsHeaders }
    );
  } catch (err) {
    console.error("Failed to simplify explanation:", err);
    return NextResponse.json(
      { error: "Failed to simplify explanation" },
      { status: 500, headers: corsHeaders }
    );
  }
}
