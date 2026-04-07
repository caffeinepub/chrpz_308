import { ExternalBlob } from "../backend";

export async function uploadMedia(
  file: File,
  onProgress?: (progress: number) => void,
): Promise<[ExternalBlob, string]> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    if (onProgress) {
      onProgress(50);
    }

    const blob = ExternalBlob.fromBytes(uint8Array);

    if (onProgress) {
      onProgress(100);
    }

    const fileName = file.name;
    return [blob, fileName];
  } catch (error) {
    console.error("Media upload error:", error);
    throw new Error(`Failed to upload ${file.name}`);
  }
}

export function getFileExtension(fileName: string): string {
  const parts = fileName.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
}

export function isVideoFile(fileName: string): boolean {
  const ext = getFileExtension(fileName);
  return ["mp4", "mov", "webm"].includes(ext);
}

export function isImageFile(fileName: string): boolean {
  const ext = getFileExtension(fileName);
  return ["jpg", "jpeg", "png", "gif", "webp"].includes(ext);
}
