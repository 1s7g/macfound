"use client";

import { upload } from "@vercel/blob/client";
import { useRef, useState } from "react";

/**
 * Photo picker for a post.
 *
 * Images are downscaled in the browser before upload. A modern phone camera
 * produces 4000px, 5MB+ files; a lost-and-found listing is legible at 1600px
 * and about a tenth of the size. Doing it client-side means faster uploads on
 * campus wifi, less storage, and quicker feeds — and it keeps every upload
 * comfortably under the size cap the token enforces.
 *
 * A note on the warning below: this app will carry photos of found student
 * cards. Blob URLs are public and permanent, so the honest fix is to tell
 * people not to photograph documents in the first place.
 */

const MAX_IMAGES = 3;
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.82;

export type UploadedImage = { url: string; name: string };

export function ImageUpload({ disabled }: { disabled?: boolean }) {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const remaining = MAX_IMAGES - images.length;

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    setBusy(true);

    try {
      const chosen = Array.from(files).slice(0, remaining);

      for (const file of chosen) {
        if (!file.type.startsWith("image/")) {
          setError("Only image files can be uploaded.");
          continue;
        }

        const resized = await downscale(file);
        const blob = await upload(resized.name, resized, {
          access: "public",
          handleUploadUrl: "/api/upload",
        });

        setImages((current) => [...current, { url: blob.url, name: file.name }]);
      }
    } catch (cause) {
      console.error("Upload failed", cause);
      setError(
        cause instanceof Error ? cause.message : "That upload didn't work. Try again.",
      );
    } finally {
      setBusy(false);
      // Let the same file be re-picked after a failure.
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function remove(url: string) {
    setImages((current) => current.filter((image) => image.url !== url));
  }

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-stone-800">
        Photos (optional, up to {MAX_IMAGES})
      </span>

      {images.length > 0 && (
        <ul className="mb-3 flex flex-wrap gap-2">
          {images.map((image) => (
            <li key={image.url} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.url}
                alt={image.name}
                className="h-24 w-24 rounded-lg border border-stone-200 object-cover"
              />
              <input type="hidden" name="imageUrls" value={image.url} />
              <button
                type="button"
                onClick={() => remove(image.url)}
                aria-label={`Remove ${image.name}`}
                className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-stone-900 text-sm leading-none text-white transition hover:bg-stone-700"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {remaining > 0 && (
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={disabled || busy}
          onChange={(event) => handleFiles(event.target.files)}
          className="block w-full cursor-pointer rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-600 outline-none transition file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-stone-900 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-stone-700 focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:opacity-60"
        />
      )}

      {busy && <p className="mt-1.5 text-xs text-stone-500">Uploading…</p>}

      {error && (
        <p role="alert" className="mt-1.5 text-sm text-red-700">
          {error}
        </p>
      )}

      <p className="mt-1.5 text-xs leading-relaxed text-stone-500">
        A photo makes an item far easier to recognise.{" "}
        <strong className="font-medium text-stone-700">
          Don&rsquo;t photograph student cards, IDs, or documents
        </strong>{" "}
        — describe them instead. Photo links are public and permanent.
      </p>
    </div>
  );
}

/**
 * Downscale to MAX_DIMENSION on the longest edge and re-encode as JPEG.
 * Returns the original untouched if it's already small or can't be decoded —
 * a failed resize should never block someone from posting.
 */
async function downscale(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));

    if (scale === 1 && file.size < 1_500_000) {
      bitmap.close();
      return file;
    }

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);

    const context = canvas.getContext("2d");
    if (!context) return file;
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
    );
    if (!blob) return file;

    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg" });
  } catch {
    return file;
  }
}
