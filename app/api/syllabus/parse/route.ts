import { NextRequest, NextResponse } from "next/server";
import {
  parseSyllabusWithAI,
  parseSyllabusFromImage,
  extractTextFromPDFBuffer,
} from "@/lib/syllabusParser";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    // 1. Handle Multipart / FormData (File Uploads)
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const rawText = formData.get("text") as string | null;
      const apiKey = (formData.get("apiKey") as string | null) || undefined;

      if (!file && !rawText) {
        return NextResponse.json(
          { error: "No file or text provided." },
          { status: 400 }
        );
      }

      if (file) {
        const fileType = file.type;
        const fileName = file.name.toLowerCase();
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // PDF Handling
        if (fileType === "application/pdf" || fileName.endsWith(".pdf")) {
          const extractedText = await extractTextFromPDFBuffer(buffer);
          if (!extractedText.trim()) {
            return NextResponse.json(
              { error: "Could not extract readable text from PDF. If it's a scanned document, please export as image (PNG/JPG)." },
              { status: 422 }
            );
          }
          const parsed = await parseSyllabusWithAI(extractedText, apiKey);
          return NextResponse.json({ success: true, syllabus: parsed, sourceType: "pdf" });
        }

        // Image Handling (PNG, JPG, WEBP, etc.)
        if (
          fileType.startsWith("image/") ||
          fileName.endsWith(".png") ||
          fileName.endsWith(".jpg") ||
          fileName.endsWith(".jpeg") ||
          fileName.endsWith(".webp")
        ) {
          const base64 = buffer.toString("base64");
          const mime = fileType || "image/jpeg";
          const parsed = await parseSyllabusFromImage(base64, mime, apiKey);
          return NextResponse.json({ success: true, syllabus: parsed, sourceType: "image" });
        }

        // Plain Text or Markdown file
        const textContent = buffer.toString("utf-8");
        const parsed = await parseSyllabusWithAI(textContent, apiKey);
        return NextResponse.json({ success: true, syllabus: parsed, sourceType: "text" });
      }

      if (rawText) {
        const parsed = await parseSyllabusWithAI(rawText, apiKey);
        return NextResponse.json({ success: true, syllabus: parsed, sourceType: "text" });
      }
    }

    // 2. Handle Direct JSON payload
    const body = await req.json();
    const { text, imageBase64, mimeType, apiKey } = body;

    if (imageBase64) {
      const parsed = await parseSyllabusFromImage(
        imageBase64,
        mimeType || "image/jpeg",
        apiKey
      );
      return NextResponse.json({ success: true, syllabus: parsed, sourceType: "image" });
    }

    if (text) {
      const parsed = await parseSyllabusWithAI(text, apiKey);
      return NextResponse.json({ success: true, syllabus: parsed, sourceType: "text" });
    }

    return NextResponse.json(
      { error: "Please provide a syllabus text, PDF, or image." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Syllabus parse error:", error);
    return NextResponse.json(
      { error: "Failed to parse syllabus. Please check your file format." },
      { status: 500 }
    );
  }
}
