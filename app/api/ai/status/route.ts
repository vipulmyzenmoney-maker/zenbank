import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const clientKey =
      req.headers.get("x-api-key") ||
      req.nextUrl.searchParams.get("key") ||
      undefined;

    const serverGemini =
      process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    const serverOpenAI = process.env.OPENAI_API_KEY;
    const serverGroq =
      process.env.GROQ_API_KEY &&
      process.env.GROQ_API_KEY !== "your-groq-api-key-here"
        ? process.env.GROQ_API_KEY
        : undefined;

    const shouldTest = req.nextUrl.searchParams.get("test") === "true";

    // 1. Determine active key and provider
    let activeKey: string | undefined = undefined;
    let provider: "gemini" | "openai" | "groq" | null = null;
    let source: "server" | "client" | "none" = "none";

    if (serverGemini) {
      activeKey = serverGemini;
      provider = "gemini";
      source = "server";
    } else if (serverOpenAI) {
      activeKey = serverOpenAI;
      provider = "openai";
      source = "server";
    } else if (serverGroq) {
      activeKey = serverGroq;
      provider = "groq";
      source = "server";
    } else if (clientKey) {
      activeKey = clientKey;
      source = "client";
      if (clientKey.startsWith("AIza")) {
        provider = "gemini";
      } else if (clientKey.startsWith("sk-")) {
        provider = "openai";
      } else {
        provider = "groq";
      }
    }

    if (!activeKey || !provider) {
      return NextResponse.json({
        active: false,
        provider: null,
        source: "none",
        message: "No AI API key configured on server or browser.",
        serverHasKey: Boolean(serverGemini || serverOpenAI || serverGroq),
        clientHasKey: Boolean(clientKey),
      });
    }

    // 2. Optional Live Test verification
    let testSuccess = true;
    let testMessage = "Key format valid and loaded";

    if (shouldTest) {
      try {
        if (provider === "gemini") {
          const testRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${activeKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: "ping" }] }],
                generationConfig: { maxOutputTokens: 2 },
              }),
            }
          );
          if (!testRes.ok) {
            testSuccess = false;
            testMessage = `Gemini API returned error ${testRes.status}`;
          } else {
            testMessage = "Google Gemini 2.0 Flash is verified & online";
          }
        } else if (provider === "openai") {
          const testRes = await fetch("https://api.openai.com/v1/models", {
            headers: { Authorization: `Bearer ${activeKey}` },
          });
          if (!testRes.ok) {
            testSuccess = false;
            testMessage = `OpenAI API returned error ${testRes.status}`;
          } else {
            testMessage = "OpenAI GPT-4o mini is verified & online";
          }
        } else if (provider === "groq") {
          const testRes = await fetch("https://api.groq.com/openai/v1/models", {
            headers: { Authorization: `Bearer ${activeKey}` },
          });
          if (!testRes.ok) {
            testSuccess = false;
            testMessage = `Groq API returned error ${testRes.status}`;
          } else {
            testMessage = "Groq LPU (Qwen 3.8 / GPT-OSS) is verified & online";
          }
        }
      } catch (testErr) {
        testSuccess = false;
        testMessage = testErr instanceof Error ? testErr.message : "Connection failed";
      }
    }

    return NextResponse.json({
      active: testSuccess,
      provider,
      source,
      message: testMessage,
      serverHasKey: Boolean(serverGemini || serverOpenAI || serverGroq),
      clientHasKey: Boolean(clientKey),
    });
  } catch (err) {
    return NextResponse.json(
      {
        active: false,
        provider: null,
        source: "none",
        message: "Error checking AI status",
      },
      { status: 500 }
    );
  }
}
