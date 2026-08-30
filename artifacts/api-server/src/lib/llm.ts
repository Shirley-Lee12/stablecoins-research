import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../config";

const TRANSIENT_LLM_ERROR = /\b(?:429|500|502|503|504)\b|high demand|temporar|timeout|network|fetch failed/i;
const NON_TRANSIENT_SPEND_CAP_ERROR = /monthly spending cap|project spend cap/i;

async function withTransientRetry<T>(operation: () => Promise<T>): Promise<T> {
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (attempt === maxAttempts || NON_TRANSIENT_SPEND_CAP_ERROR.test(message) || !TRANSIENT_LLM_ERROR.test(message)) throw error;
      await new Promise((resolve) => setTimeout(resolve, attempt * 1_500));
    }
  }
  throw new Error("LLM request failed after retries");
}

function getGeminiModel(maxOutputTokens: number) {
  const gemini = new GoogleGenerativeAI(env.LLM_API_KEY);
  return gemini.getGenerativeModel({
    model: env.LLM_MODEL,
    generationConfig: { responseMimeType: "application/json", maxOutputTokens },
  });
}

async function generateWithGemini(prompt: string, maxOutputTokens: number): Promise<string> {
  const result = await withTransientRetry(() => getGeminiModel(maxOutputTokens).generateContent(prompt));
  return result.response.text().trim();
}

function normalizeAndValidateJson(raw: string): string {
  const withoutFences = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  const objectStart = withoutFences.indexOf("{");
  const arrayStart = withoutFences.indexOf("[");
  const starts = [objectStart, arrayStart].filter((index) => index >= 0);
  const start = starts.length > 0 ? Math.min(...starts) : -1;
  if (start < 0) throw new SyntaxError("AI response did not contain JSON");
  const objectEnd = withoutFences.lastIndexOf("}");
  const arrayEnd = withoutFences.lastIndexOf("]");
  const end = Math.max(objectEnd, arrayEnd);
  if (end < start) throw new SyntaxError("AI JSON response was incomplete");
  const json = withoutFences.slice(start, end + 1);
  JSON.parse(json);
  return json;
}

async function withValidJsonRetry(operation: () => Promise<string>): Promise<string> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return normalizeAndValidateJson(await operation());
    } catch (error) {
      lastError = error;
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 500));
    }
  }
  throw lastError;
}

async function generateWithGeminiFromPdf(buffer: Buffer, prompt: string, maxOutputTokens: number): Promise<string> {
  const result = await withTransientRetry(() => getGeminiModel(maxOutputTokens).generateContent([
      { inlineData: { mimeType: "application/pdf", data: buffer.toString("base64") } },
      { text: prompt },
    ]));
  return result.response.text().trim();
}

async function generateTextWithGeminiFromPdf(buffer: Buffer, prompt: string, maxOutputTokens: number): Promise<string> {
  const gemini = new GoogleGenerativeAI(env.LLM_API_KEY);
  const model = gemini.getGenerativeModel({
    model: env.LLM_MODEL,
    generationConfig: { maxOutputTokens },
  });
  const result = await withTransientRetry(() => model.generateContent([
    { inlineData: { mimeType: "application/pdf", data: buffer.toString("base64") } },
    { text: prompt },
  ]));
  return result.response.text().trim();
}

async function generateTextWithGeminiFromImages(images: Buffer[], prompt: string, maxOutputTokens: number): Promise<string> {
  const gemini = new GoogleGenerativeAI(env.LLM_API_KEY);
  const model = gemini.getGenerativeModel({
    model: env.LLM_MODEL,
    generationConfig: { maxOutputTokens },
  });
  const result = await withTransientRetry(() => model.generateContent([
    ...images.map((image) => ({ inlineData: { mimeType: "image/png", data: image.toString("base64") } })),
    { text: prompt },
  ]));
  return result.response.text().trim();
}

/** Sends a prompt to the configured LLM provider (env.LLM_PROVIDER) and returns the raw JSON-string response. */
export async function generateJson(prompt: string, maxOutputTokens = 1024): Promise<string> {
  switch (env.LLM_PROVIDER) {
    case "gemini":
      return withValidJsonRetry(() => generateWithGemini(prompt, maxOutputTokens));
    case "anthropic":
      throw new Error("LLM_PROVIDER=anthropic is not implemented yet");
  }
}

/** Sends a PDF (native multimodal document understanding) plus a prompt to the configured LLM provider. */
export async function generateJsonFromPdf(buffer: Buffer, prompt: string, maxOutputTokens = 4096): Promise<string> {
  switch (env.LLM_PROVIDER) {
    case "gemini":
      return withValidJsonRetry(() => generateWithGeminiFromPdf(buffer, prompt, maxOutputTokens));
    case "anthropic":
      throw new Error("LLM_PROVIDER=anthropic is not implemented yet");
  }
}

/** Sends a PDF plus a prompt and returns plain text. Useful for bounded OCR, where truncation must not invalidate JSON. */
export async function generateTextFromPdf(buffer: Buffer, prompt: string, maxOutputTokens = 4096): Promise<string> {
  switch (env.LLM_PROVIDER) {
    case "gemini":
      return generateTextWithGeminiFromPdf(buffer, prompt, maxOutputTokens);
    case "anthropic":
      throw new Error("LLM_PROVIDER=anthropic is not implemented yet");
  }
}

/** OCRs a bounded batch of rendered PDF pages and returns plain text. */
export async function generateTextFromImages(images: Buffer[], prompt: string, maxOutputTokens = 4096): Promise<string> {
  switch (env.LLM_PROVIDER) {
    case "gemini":
      return generateTextWithGeminiFromImages(images, prompt, maxOutputTokens);
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
  const result = await withTransientRetry(() => model.generateContent(prompt));
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
  const result = await withTransientRetry(() => model.embedContent(text));
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
