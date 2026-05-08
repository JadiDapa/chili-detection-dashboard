import path from "path";
import { promises as fs } from "fs";

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
