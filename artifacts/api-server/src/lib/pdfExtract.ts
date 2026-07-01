import pdfParse from "pdf-parse";

// Below this character count, treat the PDF as scanned/image-only (no usable text layer).
const MIN_TEXT_LENGTH = 200;

export interface PdfExtractResult {
  text: string;
  usedOcr: boolean;
}

/**
 * OCR fallback for scanned/image PDFs — intentionally just a stub this round. The architecture
 * leaves the slot open (text-extraction path always tries this first), but wiring up Tesseract is
 * a later commit, once the electronic-PDF main path is proven out. Throws a clear, specific error
 * instead of silently failing so the upload job surfaces "OCR not enabled yet" rather than a generic crash.
 */
async function ocrFallback(_buffer: Buffer): Promise<string> {
  throw new Error("OCR fallback is not enabled yet — this PDF appears to be a scanned/image document with no extractable text layer.");
}

/** Local, fast text extraction (no LLM call, no network) — only falls back to OCR when too little text comes out. */
export async function extractPdfText(buffer: Buffer): Promise<PdfExtractResult> {
  const parsed = await pdfParse(buffer);
  const text = parsed.text.trim();
  if (text.length >= MIN_TEXT_LENGTH) {
    return { text, usedOcr: false };
  }
  const ocrText = await ocrFallback(buffer);
  return { text: ocrText, usedOcr: true };
}
