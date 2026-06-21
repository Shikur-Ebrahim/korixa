import type { ExtractedIdData } from "@/lib/kyc/types";

function parseExtractedFields(text: string): Omit<ExtractedIdData, "rawText"> {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const dobMatch = text.match(
    /\b(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}|\d{4}[\/\-.]\d{1,2}[\/\-.]\d{1,2})\b/
  );

  const idNumberMatch = text.match(/\b([A-Z0-9]{6,20})\b/);

  const nameLine =
    lines.find((line) => /name|surname|given/i.test(line)) ??
    lines.find((line) => /^[A-Za-z\s'.-]{4,}$/.test(line) && line.split(" ").length >= 2);

  const cleanedName = nameLine
    ? nameLine.replace(/^(name|surname|given names?)\s*:?\s*/i, "").trim()
    : null;

  return {
    name: cleanedName || null,
    idNumber: idNumberMatch?.[1] ?? null,
    dob: dobMatch?.[1] ?? null,
  };
}

export async function extractIdDataFromImage(imageSource: string): Promise<ExtractedIdData> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng");

  try {
    const { data } = await worker.recognize(imageSource);
    const parsed = parseExtractedFields(data.text);

    return {
      ...parsed,
      rawText: data.text.trim(),
    };
  } finally {
    await worker.terminate();
  }
}
