"use client";

export async function uploadImageWithAuth(
  fileDataUrl: string,
  folder: string,
  idToken: string
): Promise<string> {
  const res = await fetch("/api/upload", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ file: fileDataUrl, folder }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error ?? "Upload failed.");
  }

  return data.url as string;
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function canvasToDataUrl(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL("image/jpeg", 0.92);
}
