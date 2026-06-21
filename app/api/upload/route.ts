import { NextResponse } from "next/server";
import { z } from "zod";
import { AuthError, verifyAuthToken } from "@/lib/auth/verify-token";
import { uploadToCloudinary } from "@/lib/cloudinary";

const schema = z.object({
  file: z.string().min(1, "File data is required"),
  folder: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const decoded = await verifyAuthToken(request);
    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request" },
        { status: 400 }
      );
    }

    const folder = parsed.data.folder ?? `korixa/kyc/${decoded.uid}`;
    const result = await uploadToCloudinary(parsed.data.file, folder);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("upload error:", error);
    return NextResponse.json(
      { error: "Image upload failed. Please try again." },
      { status: 500 }
    );
  }
}
