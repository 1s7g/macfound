import { z } from "zod";

import { db } from "@/lib/db";
import { POST_RETENTION_DAYS } from "@/lib/vocabulary";
import {
  Category,
  CampusLocation,
  PostStatus,
  PostType,
} from "@/generated/prisma/enums";

/**
 * Post creation and feed queries.
 *
 * Validation lives here rather than in the server action so the same rules
 * apply wherever a post gets created — the action today, a seed script or an
 * import tomorrow.
 */

export const CATEGORY_VALUES = Object.values(Category) as [Category, ...Category[]];
export const LOCATION_VALUES = Object.values(CampusLocation) as [
  CampusLocation,
  ...CampusLocation[],
];

/** How far back a post may claim an item was lost or found. */
const MAX_BACKDATE_DAYS = 180;

export const createPostSchema = z
  .object({
    type: z.enum([PostType.LOST, PostType.FOUND]),
    title: z
      .string()
      .trim()
      .min(4, "Give it a short title — at least a few characters.")
      .max(120, "Keep the title under 120 characters."),
    description: z
      .string()
      .trim()
      .min(10, "Add a bit more detail — colour, brand, distinguishing marks.")
      .max(2000, "Keep the description under 2000 characters."),
    category: z.enum(CATEGORY_VALUES),
    location: z.enum(LOCATION_VALUES),
    locationDetail: z
      .string()
      .trim()
      .max(160, "Keep this short — e.g. '3rd floor, near the printers'.")
      .optional()
      .or(z.literal("")),
    occurredOn: z
      .string()
      .min(1, "When did this happen?")
      .refine((value) => !Number.isNaN(Date.parse(value)), "That date isn't valid."),
    // Checkbox: present in the body only when ticked, hence the coercion.
    // Only meaningful on FOUND posts; the superRefine below drops it otherwise.
    handedIn: z
      .union([z.literal("on"), z.literal("true"), z.literal("")])
      .optional()
      .transform((value) => value === "on" || value === "true"),
  })
  .superRefine((value, ctx) => {
    const when = parseLocalDate(value.occurredOn);
    const today = endOfToday();

    if (when > today) {
      ctx.addIssue({
        code: "custom",
        path: ["occurredOn"],
        message: "That date is in the future.",
      });
    }

    const earliest = new Date(today);
    earliest.setDate(earliest.getDate() - MAX_BACKDATE_DAYS);
    if (when < earliest) {
      ctx.addIssue({
        code: "custom",
        path: ["occurredOn"],
        message: `That's more than ${MAX_BACKDATE_DAYS} days ago — too old to post.`,
      });
    }

    // "Handed in" describes what a finder did with an item. On a lost report it
    // would claim the poster gave away something they don't have.
    if (value.handedIn && value.type !== PostType.FOUND) {
      ctx.addIssue({
        code: "custom",
        path: ["handedIn"],
        message: "Only a found item can be handed in.",
      });
    }
  });

export type CreatePostInput = z.infer<typeof createPostSchema>;

/**
 * Parse a yyyy-mm-dd form value as local midday.
 *
 * `new Date("2026-08-09")` is parsed as UTC midnight, which in Hamilton is the
 * evening of the 8th — every date would display a day early. Midday local is
 * far enough from both boundaries to survive any timezone the user is in.
 */
export function parseLocalDate(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return new Date(value);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

function endOfToday(): Date {
  const now = new Date();
  now.setHours(23, 59, 59, 999);
  return now;
}

/** Public host every Vercel Blob URL sits under. */
const BLOB_HOST_SUFFIX = ".public.blob.vercel-storage.com";

/**
 * Keep only URLs that really point at our blob storage.
 *
 * Image URLs arrive as form fields, so a crafted submission could put any URL
 * on the page — hotlinking someone else's bandwidth at best, embedding a
 * tracking pixel or shock image on a McMaster-branded board at worst. The
 * upload route is the only legitimate source of these, and everything it
 * produces lives under the blob host.
 */
export function sanitizeImageUrls(urls: string[], limit = 3): string[] {
  const seen = new Set<string>();

  return urls
    .filter((raw) => {
      let parsed: URL;
      try {
        parsed = new URL(raw);
      } catch {
        return false;
      }
      if (parsed.protocol !== "https:") return false;
      if (!parsed.hostname.endsWith(BLOB_HOST_SUFFIX)) return false;
      if (seen.has(parsed.href)) return false;
      seen.add(parsed.href);
      return true;
    })
    .slice(0, limit);
}

export async function createPost(
  authorId: string,
  input: CreatePostInput,
  imageUrls: string[] = [],
) {
  const images = sanitizeImageUrls(imageUrls);

  return db.post.create({
    data: {
      images: {
        create: images.map((url, position) => ({ url, position })),
      },
      authorId,
      type: input.type,
      title: input.title,
      description: input.description,
      category: input.category,
      location: input.location,
      locationDetail: input.locationDetail?.trim() || null,
      occurredOn: parseLocalDate(input.occurredOn),
      handedInAt: input.handedIn ? new Date() : null,
    },
    select: { id: true },
  });
}

// --- Feed ------------------------------------------------------------------

export type FeedFilters = {
  category?: Category;
  location?: CampusLocation;
  query?: string;
};

export const FEED_PAGE_SIZE = 20;

/**
 * Posts for one side of the board, newest first.
 *
 * Text search is a case-insensitive substring match for now. At the scale this
 * will run at — hundreds of open posts — that's indistinguishable from anything
 * cleverer. Proper full-text search (tsvector + GIN) arrives with the matching
 * engine, which needs it for scoring rather than filtering.
 */
export async function getFeed(
  type: PostType,
  filters: FeedFilters = {},
  page = 0,
) {
  const query = filters.query?.trim();

  const where = {
    type,
    status: PostStatus.OPEN,
    ...(filters.category ? { category: filters.category } : {}),
    ...(filters.location ? { location: filters.location } : {}),
    ...(query
      ? {
          OR: [
            { title: { contains: query, mode: "insensitive" as const } },
            { description: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [posts, total] = await Promise.all([
    db.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: page * FEED_PAGE_SIZE,
      take: FEED_PAGE_SIZE,
      select: {
        id: true,
        type: true,
        title: true,
        description: true,
        category: true,
        location: true,
        locationDetail: true,
        occurredOn: true,
        createdAt: true,
        handedInAt: true,
        images: { select: { url: true }, orderBy: { position: "asc" }, take: 1 },
        _count: { select: { comments: true } },
      },
    }),
    db.post.count({ where }),
  ]);

  return { posts, total, page, pageSize: FEED_PAGE_SIZE };
}

export type FeedPost = Awaited<ReturnType<typeof getFeed>>["posts"][number];

/**
 * A single post. Claims are filtered by viewer: the author sees all of them,
 * anyone else sees only their own.
 */
export async function getPost(id: string, viewerId: string) {
  const post = await db.post.findUnique({
    where: { id },
    select: {
      id: true,
      type: true,
      title: true,
      description: true,
      category: true,
      location: true,
      locationDetail: true,
      occurredOn: true,
      status: true,
      createdAt: true,
      resolvedAt: true,
      handedInAt: true,
      authorId: true,
      author: { select: { id: true, name: true, email: true } },
      images: { select: { id: true, url: true }, orderBy: { position: "asc" } },
      comments: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          body: true,
          createdAt: true,
          author: { select: { id: true, name: true } },
        },
      },
      claims: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          answer: true,
          status: true,
          createdAt: true,
          claimantId: true,
          claimant: { select: { id: true, name: true } },
        },
      },
      _count: { select: { claims: true } },
    },
  });

  if (!post) return null;

  const isAuthor = post.authorId === viewerId;

  // Strip the verification answer here rather than merely hiding it in the UI.
  // It must never reach a non-author's browser: it arrives in the server
  // component payload, so "don't render it" would still ship it in the HTML
  // stream where anyone can read it from view-source.
  // Other people's claim answers are stripped here rather than hidden in the
  // UI. A server component's props are streamed to the browser inside the RSC
  // payload, so "don't render it" still ships them to anyone who opens
  // view-source — handing a chancer the exact wording a genuine owner used.
  return {
    ...post,
    claims: isAuthor
      ? post.claims
      : post.claims.filter((claim) => claim.claimantId === viewerId),
    isAuthor,
  };
}

export function expiryDate(createdAt: Date): Date {
  const expires = new Date(createdAt);
  expires.setDate(expires.getDate() + POST_RETENTION_DAYS);
  return expires;
}

// --- Ownership: edit, delete, and your own history -------------------------

/**
 * Update a post the viewer owns.
 *
 * Images aren't touched here. Replacing them means uploading new blobs and
 * orphaning old ones, which belongs with the cleanup job rather than bolted
 * onto an edit.
 */
export async function updatePost(
  postId: string,
  authorId: string,
  input: CreatePostInput,
) {
  const post = await db.post.findUnique({
    where: { id: postId },
    select: { id: true, authorId: true, handedInAt: true },
  });

  // Ownership is re-checked here, not just in the UI that renders the button.
  if (!post || post.authorId !== authorId) return null;

  return db.post.update({
    where: { id: post.id },
    data: {
      title: input.title,
      description: input.description,
      category: input.category,
      location: input.location,
      locationDetail: input.locationDetail?.trim() || null,
      occurredOn: parseLocalDate(input.occurredOn),
      // Preserve the original timestamp when it was already handed in, so
      // editing the description doesn't reset the clock the owner is racing.
      handedInAt: input.handedIn ? (post.handedInAt ?? new Date()) : null,
    },
    select: { id: true, type: true },
  });
}

/**
 * Delete a post and its photos.
 *
 * Rows cascade from the schema; the blobs don't, so they're removed explicitly.
 * Blob deletion is best-effort — a storage hiccup shouldn't leave someone
 * unable to take down their own post, which is exactly when they most want to.
 */
export async function deletePost(postId: string, authorId: string) {
  const post = await db.post.findUnique({
    where: { id: postId },
    select: { id: true, authorId: true, type: true, images: { select: { url: true } } },
  });

  if (!post || post.authorId !== authorId) return null;

  if (post.images.length > 0) {
    try {
      const { del } = await import("@vercel/blob");
      await del(post.images.map((image) => image.url));
    } catch (error) {
      console.error("Failed to delete blobs for post", postId, error);
    }
  }

  await db.post.delete({ where: { id: post.id } });
  return { type: post.type };
}

/** Everything the viewer has posted, newest first, whatever its status. */
export async function getMyPosts(authorId: string) {
  return db.post.findMany({
    where: { authorId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      type: true,
      title: true,
      status: true,
      category: true,
      location: true,
      occurredOn: true,
      createdAt: true,
      images: { select: { url: true }, orderBy: { position: "asc" }, take: 1 },
      _count: { select: { comments: true, claims: true } },
    },
  });
}

/**
 * Headline numbers.
 *
 * "Reunited" is the only figure that actually says the app works — posts and
 * users measure activity, not outcomes.
 */
export async function getStats() {
  const [reunited, open, total] = await Promise.all([
    db.post.count({ where: { status: PostStatus.RESOLVED } }),
    db.post.count({ where: { status: PostStatus.OPEN } }),
    db.post.count(),
  ]);

  return { reunited, open, total };
}
