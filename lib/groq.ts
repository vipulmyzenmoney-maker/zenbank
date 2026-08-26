import Groq from "groq-sdk";

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "",
});

export const GENERATION_MODEL = "llama-3.3-70b-versatile";
export const VISION_MODEL = "llama-3.2-11b-vision-preview";
