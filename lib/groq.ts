import Groq from "groq-sdk";

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "",
});

export const PRIMARY_GENERATION_MODEL = "openai/gpt-oss-120b";
export const SECONDARY_GENERATION_MODEL = "openai/gpt-oss-20b";
export const GENERATION_MODEL = PRIMARY_GENERATION_MODEL;

