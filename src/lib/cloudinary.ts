import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";

let configured = false;

function ensureCloudinaryConfig() {
  if (configured) return;

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary credentials are not fully configured.");
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  configured = true;
}

export type CloudinaryUploadResult = {
  url: string;
  publicId: string;
  width: number;
  height: number;
};

/**
 * Upload a base64 or remote image to Cloudinary (server-side only).
 */
export async function uploadToCloudinary(
  file: string,
  folder = "korixa"
): Promise<CloudinaryUploadResult> {
  ensureCloudinaryConfig();

  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;

  const result: UploadApiResponse = await cloudinary.uploader.upload(file, {
    folder,
    upload_preset: uploadPreset || undefined,
    resource_type: "image",
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
  };
}

export { cloudinary };
