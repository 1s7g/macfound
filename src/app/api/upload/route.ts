import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

import { getUser } from "@/lib/session";

/**
 * Issues scoped upload tokens for client-side uploads to Vercel Blob.
 *
 * The file never passes through this server. Vercel caps a serverless request
 * body at 4.5MB and photos straight off a phone routinely exceed that, so
 * routing bytes through a server action would fail on exactly the uploads this
 * app exists to handle. Instead the browser asks for a token, uploads directly
 * to Blob, and hands back the resulting URL.
 *
 * onBeforeGenerateToken is the security boundary: it runs on the server for
 * every upload, so an unauthenticated caller cannot obtain a token even though
 * the upload itself is client-driven.
 */

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // after client-side downscaling

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        // Only verified McMaster accounts may upload anything.
        const user = await getUser();
        if (!user) throw new Error("Sign in to upload photos.");

        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp"],
          maximumSizeInBytes: MAX_UPLOAD_BYTES,
          addRandomSuffix: true,
          // Ties each blob to its uploader for later moderation and cleanup.
          tokenPayload: JSON.stringify({ userId: user.id }),
        };
      },
      onUploadCompleted: async () => {
        // Nothing to do yet. The URL is attached to a post when the form is
        // submitted; orphaned blobs are handled by the cleanup job that will
        // land with post expiry.
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
