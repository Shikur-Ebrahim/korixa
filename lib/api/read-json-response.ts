type JsonRecord = Record<string, unknown>;

export async function readJsonResponse<T extends JsonRecord = JsonRecord>(
  res: Response
): Promise<T> {
  const raw = await res.text();
  const contentType = res.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    if (res.status === 404) {
      throw new Error("Sign-in service is unavailable. Please refresh and try again.");
    }

    throw new Error(
      "Could not reach the sign-in service. Check your connection or try again shortly."
    );
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error("Unexpected server response. Please try again.");
  }
}
