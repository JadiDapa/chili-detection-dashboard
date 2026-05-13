import path from "path";
import { promises as fs } from "fs";

// Fetch an image from a remote URL and save it to `directory`.
// Throws on fetch error or non-2xx status — callers should catch.
export async function fileUploadFromUrl(
  url: string,
  directory: string,
  timeoutMs = 10_000,
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) throw new Error(`HTTP ${res.status} fetching image: ${url}`);

  const contentType = res.headers.get("content-type") ?? "";
  const ext = contentType.includes("png")
    ? ".png"
    : contentType.includes("webp")
      ? ".webp"
      : ".jpg";

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const newFileName = `${timestamp}${ext}`;

  const buffer = Buffer.from(await res.arrayBuffer());
  const pathname = path.join(process.cwd(), directory, newFileName);
  await fs.writeFile(pathname, buffer);

  return newFileName;
}

export async function fileUpload(file: File, directory: string) {
  // Get current datetime as a formatted string
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, "-"); // Replace colons and dots for a safe filename

  // Extract the file extension
  const extension = path.extname(file.name);

  // Create the new file name using datetime
  const newFileName = `${timestamp}${extension}`;

  // Convert the image to a buffer
  const buffer = Buffer.from(await file.arrayBuffer());

  // Save the image to the uploads folder with the new name
  const pathname = path.join(process.cwd(), directory, newFileName);
  await fs.writeFile(pathname, buffer);

  return newFileName;
}
