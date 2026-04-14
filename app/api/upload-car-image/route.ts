import { NextRequest, NextResponse } from "next/server";
import { storage, BUCKET_ID, ID } from "@/lib/appwrite";

/**
 * POST /api/upload-car-image
 *
 * Accepts a validated car image file (multipart/form-data),
 * uploads it to Appwrite Storage, and returns the file ID and view URL.
 *
 * Returns: { fileId: string, fileUrl: string }
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Generate a unique file ID
    const fileId = ID.unique();

    // Derive proper file extension from MIME type
    const extMap: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/heic": "heic",
      "image/heif": "heif",
      "image/gif": "gif",
    };
    const ext = extMap[file.type] || "jpg";
    const properName = `car-${fileId}.${ext}`;

    // Create a new File with the proper name so Appwrite accepts the extension
    const arrayBuffer = await file.arrayBuffer();
    const namedFile = new File([arrayBuffer], properName, { type: file.type });

    // Upload to Appwrite Storage (with retry for transient 503/timeout errors)
    const MAX_RETRIES = 3;
    let result;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        result = await storage.createFile(
          BUCKET_ID,
          attempt === 1 ? fileId : ID.unique(), // fresh ID on retry to avoid conflict
          namedFile
        );
        break; // success — exit loop
      } catch (uploadErr: any) {
        const status = uploadErr?.code || uploadErr?.status;
        const isRetryable = status === 503 || status === 502 || status === 504 || status === 408;

        if (isRetryable && attempt < MAX_RETRIES) {
          console.warn(`Appwrite upload attempt ${attempt} failed (${status}), retrying in ${attempt * 2}s...`);
          await new Promise((r) => setTimeout(r, attempt * 2000));
          continue;
        }
        throw uploadErr; // non-retryable or max retries exceeded
      }
    }

    if (!result) {
      throw new Error("Upload failed after all retries");
    }

    // Construct the view/preview URL
    const endpoint = process.env.APPWRITE_ENDPOINT!;
    const projectId = process.env.APPWRITE_PROJECT_ID!;
    const fileUrl = `${endpoint}/storage/buckets/${BUCKET_ID}/files/${result.$id}/view?project=${projectId}`;

    return NextResponse.json({
      fileId: result.$id,
      fileUrl,
    });
  } catch (error) {
    console.error("upload-car-image error:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}
