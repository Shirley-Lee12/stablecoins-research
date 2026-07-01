import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../config";

function getGeminiModel(maxOutputTokens: number) {
  const gemini = new GoogleGenerativeAI(env.LLM_API_KEY);
  return gemini.getGenerativeModel({
    model: env.LLM_MODEL,
    generationConfig: { responseMimeType: "application/json", maxOutputTokens },
  });
}

async function generateWithGemini(prompt: string, maxOutputTokens: number): Promise<string> {
  const result = await getGeminiModel(maxOutputTokens).generateContent(prompt);
  return result.response.text().trim();
}

async function generateWithGeminiFromPdf(buffer: Buffer, prompt: string, maxOutputTokens: number): Promise<string> {
  const result = await getGeminiModel(maxOutputTokens).generateContent([
    { inlineData: { mimeType: "application/pdf", data: buffer.toString("base64") } },
    { text: prompt },
  ]);
  return result.response.text().trim();
}

/** Sends a prompt to the configured LLM provider (env.LLM_PROVIDER) and returns the raw JSON-string response. */
export async function generateJson(prompt: string, maxOutputTokens = 1024): Promise<string> {
  switch (env.LLM_PROVIDER) {
    case "gemini":
      return generateWithGemini(prompt, maxOutputTokens);
    case "anthropic":
      throw new Error("LLM_PROVIDER=anthropic is not implemented yet");
  }
}

/** Sends a PDF (native multimodal document understanding) plus a prompt to the configured LLM provider. */
export async function generateJsonFromPdf(buffer: Buffer, prompt: string, maxOutputTokens = 4096): Promise<string> {
  switch (env.LLM_PROVIDER) {
    case "gemini":
      return generateWithGeminiFromPdf(buffer, prompt, maxOutputTokens);
    case "anthropic":
      throw new Error("LLM_PROVIDER=anthropic is not implemented yet");
  }
}

// Gemini's built-in Google Search grounding tool, used as a last-resort fallback when a resource
// isn't indexed in any academic database (e.g. news/opinion pieces — see resolveLink.ts). The Gemini
// API doesn't allow combining responseMimeType:"application/json" with tool use, so JSON-ness here
// is enforced by prompt instruction rather than generationConfig, same as the pre-structured-output
// era — callers must still defensively JSON.parse() the result.
async function generateWithGeminiSearch(prompt: string, maxOutputTokens: number): Promise<string> {
  const gemini = new GoogleGenerativeAI(env.LLM_API_KEY);
  const model = gemini.getGenerativeModel({
    model: env.LLM_MODEL,
    tools: [{ googleSearch: {} } as any],
    generationConfig: { maxOutputTokens },
  });
  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

/** Like generateJson(), but grounds the answer in a live Google Search instead of training-data recall. Prompt must itself ask for JSON — responseMimeType can't be combined with tool use. */
export async function generateJsonWithSearch(prompt: string, maxOutputTokens = 1024): Promise<string> {
  switch (env.LLM_PROVIDER) {
    case "gemini":
      return generateWithGeminiSearch(prompt, maxOutputTokens);
    case "anthropic":
      throw new Error("LLM_PROVIDER=anthropic is not implemented yet");
  }
}

// Embedding models are a separate model family from the generative one configured via
// env.LLM_MODEL (e.g. "gemini-2.5-flash") — hardcode the embedding model rather than reusing it.
// "text-embedding-004" (the older name) has been retired; "gemini-embedding-001" is current as of 2026-06.
async function embedWithGemini(text: string): Promise<number[]> {
  const gemini = new GoogleGenerativeAI(env.LLM_API_KEY);
  const model = gemini.getGenerativeModel({ model: "gemini-embedding-001" });
  const result = await model.embedContent(text);
  return result.embedding.values;
}

/** Returns a dense embedding vector for similarity matching (e.g. resource abstract vs. tag definitions). */
export async function embedText(text: string): Promise<number[]> {
  switch (env.LLM_PROVIDER) {
    case "gemini":
      return embedWithGemini(text);
    case "anthropic":
      throw new Error("LLM_PROVIDER=anthropic is not implemented yet");
  }
}
