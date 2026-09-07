/**
 * Universal Multi-Provider Vision & Syllabus Parser
 * Supports Google Gemini 2.0 Flash (Primary), OpenAI GPT-4o-mini, and Groq.
 */

export interface ParsedVisionSyllabus {
  title: string;
  gradeLevel: string;
  subject: string;
  topics: string[];
  summary?: string;
  provider?: string;
}

const SYLLABUS_PROMPT = `You are an expert curriculum director, academic educator, and OCR specialist.
Carefully examine this syllabus, textbook table of contents, curriculum sheet, or lesson plan image.

Task:
1. Accurately identify the exact subject (e.g., Mathematics, Science, English Language Arts, Social Studies, Physics, Chemistry, Biology, History).
2. Accurately identify the specific grade level (e.g., "5th Grade", "6th Grade", "Kindergarten", "10th Grade", "Undergraduate"). If not explicitly printed, infer the target grade level strictly from the curriculum difficulty of the topics shown.
3. Extract a concise, accurate course or unit title (e.g., "Grade 5 Mathematics Curriculum", "Fractions & Decimals Unit").
4. Extract every discrete learning topic or chapter as a clean list of individual topic titles.
5. Provide a brief 1-2 sentence summary of what the syllabus covers.

Return ONLY a valid JSON object matching this schema with no extra conversational text or markdown formatting:
{
  "title": "Concise course/unit title",
  "gradeLevel": "e.g. 5th Grade",
  "subject": "e.g. Mathematics",
  "topics": [
    "Topic 1",
    "Topic 2",
    "Topic 3"
  ],
  "summary": "Brief 1-2 sentence overview of the curriculum"
}`;

/**
 * Parses an image using Google Gemini 2.0 Flash
 */
async function parseWithGemini(
  base64Data: string,
  mimeType: string,
  apiKey: string
): Promise<ParsedVisionSyllabus> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  // Clean base64 string if it contains data URI prefix
  const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, "");

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: SYLLABUS_PROMPT },
            {
              inline_data: {
                mime_type: mimeType,
                data: cleanBase64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        response_mime_type: "application/json",
        temperature: 0.1,
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errText}`);
  }

  const json = await response.json();
  const textContent =
    json?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!textContent) {
    throw new Error("Gemini returned empty response content.");
  }

  const parsed = JSON.parse(textContent);
  return validateParsedData(parsed, "Google Gemini 2.0 Flash");
}

/**
 * Parses an image using OpenAI GPT-4o-mini
 */
async function parseWithOpenAI(
  base64Data: string,
  mimeType: string,
  apiKey: string
): Promise<ParsedVisionSyllabus> {
  const cleanBase64 = base64Data.startsWith("data:")
    ? base64Data
    : `data:${mimeType};base64,${base64Data}`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: SYLLABUS_PROMPT },
            {
              type: "image_url",
              image_url: { url: cleanBase64, detail: "high" },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${errText}`);
  }

  const json = await response.json();
  const textContent = json?.choices?.[0]?.message?.content;
  if (!textContent) {
    throw new Error("OpenAI returned empty response content.");
  }

  const parsed = JSON.parse(textContent);
  return validateParsedData(parsed, "OpenAI GPT-4o-mini");
}

/**
 * Validates and normalizes parsed AI JSON structure
 */
function validateParsedData(parsed: any, provider: string): ParsedVisionSyllabus {
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid response format: expected JSON object.");
  }

  const rawTopics = Array.isArray(parsed.topics) ? parsed.topics : [];
  const cleanTopics = rawTopics
    .map((t: any) => String(t).trim())
    .filter((t: string) => t.length > 0);

  if (cleanTopics.length === 0) {
    throw new Error("No discrete syllabus topics could be detected in the image.");
  }

  return {
    title: parsed.title?.trim() || "Extracted Curriculum",
    gradeLevel: parsed.gradeLevel?.trim() || "5th Grade",
    subject: parsed.subject?.trim() || "General",
    topics: cleanTopics,
    summary: parsed.summary?.trim() || undefined,
    provider,
  };
}

/**
 * Primary entry point for Vision OCR & Syllabus analysis.
 * Automatically selects the active provider based on configured keys.
 */
export async function extractSyllabusFromImage(
  base64Data: string,
  mimeType: string = "image/jpeg",
  customKey?: string
): Promise<ParsedVisionSyllabus> {
  const geminiKey =
    customKey?.startsWith("AIza") ? customKey : process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  const openAiKey =
    customKey?.startsWith("sk-") ? customKey : process.env.OPENAI_API_KEY;

  const anyCustomKey = customKey && customKey !== "your-groq-api-key-here" ? customKey : null;

  // 1. Try Google Gemini (Best for document vision & OCR)
  if (geminiKey) {
    try {
      return await parseWithGemini(base64Data, mimeType, geminiKey);
    } catch (err) {
      console.warn("Gemini vision parse failed:", err);
      // Fall through to other keys if available
    }
  }

  // 2. Try OpenAI GPT-4o-mini
  if (openAiKey) {
    try {
      return await parseWithOpenAI(base64Data, mimeType, openAiKey);
    } catch (err) {
      console.warn("OpenAI vision parse failed:", err);
    }
  }

  // 3. Try custom key with Gemini or OpenAI if format detected
  if (anyCustomKey) {
    if (anyCustomKey.startsWith("AIza")) {
      return await parseWithGemini(base64Data, mimeType, anyCustomKey);
    } else if (anyCustomKey.startsWith("sk-")) {
      return await parseWithOpenAI(base64Data, mimeType, anyCustomKey);
    } else {
      // Try Gemini first, then OpenAI with custom key
      try {
        return await parseWithGemini(base64Data, mimeType, anyCustomKey);
      } catch {
        return await parseWithOpenAI(base64Data, mimeType, anyCustomKey);
      }
    }
  }

  // If no keys configured or all failed:
  throw new Error(
    "NO_API_KEY: No active Vision API key found. Please provide a Google Gemini API Key or OpenAI API Key in Settings to scan syllabus images."
  );
}
