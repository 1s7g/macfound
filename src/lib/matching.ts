import { db } from "@/lib/db";
import { locationScore } from "@/lib/campus";
import { notifyUnlessSelf } from "@/lib/notifications";
import { CampusLocation, Category, PostStatus, PostType } from "@/generated/prisma/enums";

/**
 * The matching engine.
 *
 * When someone posts a found bottle, the people who lost a bottle shouldn't
 * have to be browsing at that moment. This scores the new post against every
 * plausible counterpart and tells the likely owner.
 *
 * Four signals, combined into one score in [0, 1]:
 *
 *   text      how similar the words are (Postgres full-text + trigram)
 *   category  same category or not
 *   location  distance between buildings, from real coordinates
 *   date      whether the timeline makes sense
 *
 * The date signal is directional and that matters more than it sounds. For a
 * LOST/FOUND pair the item must be found at or after it was lost — a bottle
 * "found" three days before it went missing is a different bottle. Treating
 * date as a symmetric window would happily pair those.
 */

/** Weights sum to 1. Tuned against the seed set; see scripts in the repo history. */
const WEIGHTS = {
  text: 0.4,
  category: 0.25,
  location: 0.2,
  date: 0.15,
} as const;

/** Below this a pair isn't worth storing. */
export const PERSIST_THRESHOLD = 0.35;

/**
 * Minimum textual overlap for a cross-category pair to count as a match at all.
 *
 * Location and date are corroborating evidence, not identifying evidence: that
 * two things were in Thode four days apart says Thode is busy, not that they're
 * the same object. Without this gate they carried 0.35 between them, which was
 * enough on its own to suggest a green backpack to someone who lost an AirPods
 * case.
 *
 * So a pair needs some evidence of item identity before place and time get a
 * vote — either the same category, or enough shared wording to suggest the
 * category labels just differ (a "wallet" filed under Keys by one person and
 * Other by another).
 */
const MIN_TEXT_ACROSS_CATEGORIES = 0.15;
/** Below this we store the suggestion but don't interrupt anyone about it. */
export const NOTIFY_THRESHOLD = 0.55;
/**
 * Category, location and date alone can push two unrelated items past the
 * notify threshold — two water bottles, same building, same week, describing
 * completely different objects. Requiring some textual overlap before
 * interrupting anyone keeps those as quiet suggestions instead of alerts.
 */
const MIN_TEXT_TO_NOTIFY = 0.12;

/** How far apart in time two posts can be and still plausibly be one item. */
const MAX_DAYS_APART = 30;
/** Candidate window either side, wide enough to catch late reports. */
const CANDIDATE_WINDOW_DAYS = 45;

type CandidateRow = {
  id: string;
  authorId: string;
  title: string;
  category: Category;
  location: CampusLocation;
  occurredOn: Date;
  ts_score: number;
  trg_score: number;
};

export type ScoredMatch = {
  candidateId: string;
  score: number;
  textScore: number;
  categoryHit: boolean;
  locationHit: boolean;
  daysApart: number;
};

/**
 * Text similarity, computed in Postgres so the GIN indexes do the work.
 *
 * Two measures, because they fail differently:
 *  - full-text search stems and matches whole words, so "bottles" finds
 *    "bottle", but it scores zero when nobody used the same word;
 *  - trigram similarity compares character runs, so it survives typos,
 *    compound words and brand names ("hydroflask" vs "Hydro Flask").
 *
 * Taking the max means either one can carry a match on its own.
 *
 * Two details here were found by measuring, not by reasoning:
 *
 * 1. The query is built from the source's TITLE, not title + description.
 *    Feeding in the whole description made "Laptop charger… left it plugged in
 *    under a desk" score 0.25 against "Green backpack… found under a desk" —
 *    ts_rank gives credit for any overlapping lexeme, and long free text shares
 *    plenty of incidental ones. Titles are short and almost entirely
 *    content-bearing, so overlap there means something.
 *
 * 2. The query uses OR semantics. plainto_tsquery ANDs every term, which
 *    scored a real pair — "Black Hydro Flask, covered in stickers" against
 *    "Navy metal water bottle with stickers" — at exactly zero, because no
 *    single document contained all five words. OR-ing the lexemes turns
 *    ts_rank back into the graded overlap measure this needs.
 */

/**
 * Observed ts_rank for a strong pair is ~0.43 and for unrelated pairs ~0.00.
 * 2.5 maps that top end onto ~1.0, matching the range trigram already uses.
 */
const TS_RANK_SCALE = 2.5;

async function scoreCandidatesByText(
  sourceId: string,
  sourceTitle: string,
  wantedType: PostType,
  from: Date,
  to: Date,
): Promise<CandidateRow[]> {
  return db.$queryRaw<CandidateRow[]>`
    WITH q AS (
      SELECT NULLIF(
        array_to_string(
          tsvector_to_array(to_tsvector('english', ${sourceTitle})),
          ' | '
        ),
        ''
      ) AS terms
    )
    SELECT
      p."id",
      p."authorId",
      p."title",
      p."category",
      p."location",
      p."occurredOn",
      COALESCE(
        LEAST(
          ts_rank(
            setweight(to_tsvector('english', coalesce(p."title", '')), 'A') ||
            setweight(to_tsvector('english', coalesce(p."description", '')), 'B'),
            to_tsquery('english', (SELECT terms FROM q))
          ) * ${TS_RANK_SCALE},
          1
        ),
        0
      )::float8 AS ts_score,
      GREATEST(
        similarity(p."title", ${sourceTitle}),
        similarity(p."description", ${sourceTitle})
      )::float8 AS trg_score
    FROM "Post" p
    WHERE p."type" = ${wantedType}::"PostType"
      AND p."status" = ${PostStatus.OPEN}::"PostStatus"
      AND p."id" <> ${sourceId}
      AND p."occurredOn" BETWEEN ${from} AND ${to}
    LIMIT 500
  `;
}

/**
 * Timeline plausibility.
 *
 * `lost` and `found` are the two posts' occurredOn dates. Finding something
 * before it was lost is close to impossible, so that's scored near zero rather
 * than merely penalised — otherwise a strong text match would drag an
 * impossible pair over the threshold.
 */
export function dateScore(lost: Date, found: Date): { score: number; daysApart: number } {
  const deltaDays = Math.round((found.getTime() - lost.getTime()) / 86_400_000);
  const daysApart = Math.abs(deltaDays);

  // A day of slack: people misremember which day they lost something.
  if (deltaDays < -1) return { score: 0, daysApart };
  if (daysApart > MAX_DAYS_APART) return { score: 0, daysApart };
  if (daysApart <= 3) return { score: 1, daysApart };

  return { score: Math.max(0, 1 - (daysApart - 3) / (MAX_DAYS_APART - 3)), daysApart };
}

/** Score one candidate against the source post. */
export function combineScores(input: {
  textScore: number;
  sameCategory: boolean;
  locationScore: number;
  dateScore: number;
}): number {
  return (
    WEIGHTS.text * input.textScore +
    WEIGHTS.category * (input.sameCategory ? 1 : 0) +
    WEIGHTS.location * input.locationScore +
    WEIGHTS.date * input.dateScore
  );
}

/**
 * Find and persist matches for a post, and notify about the strong ones.
 *
 * Matches are stored rather than recomputed on every page view: it lets us
 * notify exactly once, lets users dismiss a bad suggestion permanently, and
 * leaves a record to measure precision against later ("of the matches we
 * surfaced, how many led to a resolved post?").
 */
export async function runMatching(postId: string): Promise<ScoredMatch[]> {
  const source = await db.post.findUnique({
    where: { id: postId },
    select: {
      id: true,
      type: true,
      status: true,
      title: true,
      description: true,
      category: true,
      location: true,
      occurredOn: true,
      authorId: true,
    },
  });

  if (!source || source.status !== PostStatus.OPEN) return [];

  const wantedType = source.type === PostType.LOST ? PostType.FOUND : PostType.LOST;
  const from = new Date(source.occurredOn);
  from.setDate(from.getDate() - CANDIDATE_WINDOW_DAYS);
  const to = new Date(source.occurredOn);
  to.setDate(to.getDate() + CANDIDATE_WINDOW_DAYS);

  const candidates = await scoreCandidatesByText(
    source.id,
    source.title,
    wantedType,
    from,
    to,
  );

  const scored: ScoredMatch[] = [];

  for (const candidate of candidates) {
    const textScore = Math.max(candidate.ts_score ?? 0, candidate.trg_score ?? 0);
    const sameCategory = candidate.category === source.category;
    const place = locationScore(source.location, candidate.location);

    // Orient the pair so "lost" really is the lost side, whichever one is new.
    const [lostAt, foundAt] =
      source.type === PostType.LOST
        ? [source.occurredOn, candidate.occurredOn]
        : [candidate.occurredOn, source.occurredOn];

    const { score: timing, daysApart } = dateScore(lostAt, foundAt);

    // Identity gate — see MIN_TEXT_ACROSS_CATEGORIES. Nothing about where or
    // when two items turned up can make a backpack into an earbud case.
    if (!sameCategory && textScore < MIN_TEXT_ACROSS_CATEGORIES) continue;

    // A timeline that can't happen isn't a weak match, it's not a match.
    if (timing === 0) continue;

    const score = combineScores({
      textScore,
      sameCategory,
      locationScore: place,
      dateScore: timing,
    });

    if (score >= PERSIST_THRESHOLD) {
      scored.push({
        candidateId: candidate.id,
        score,
        textScore,
        categoryHit: sameCategory,
        locationHit: place > 0,
        daysApart,
      });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, 10);

  for (const match of top) {
    // Upsert: re-running the matcher must not create duplicates or re-notify.
    const existing = await db.match.findUnique({
      where: { sourceId_candidateId: { sourceId: source.id, candidateId: match.candidateId } },
      select: { id: true, notifiedAt: true },
    });

    if (existing) {
      await db.match.update({
        where: { id: existing.id },
        data: {
          score: match.score,
          textScore: match.textScore,
          categoryHit: match.categoryHit,
          locationHit: match.locationHit,
          daysApart: match.daysApart,
        },
      });
      continue;
    }

    await db.match.create({
      data: {
        sourceId: source.id,
        candidateId: match.candidateId,
        score: match.score,
        textScore: match.textScore,
        categoryHit: match.categoryHit,
        locationHit: match.locationHit,
        daysApart: match.daysApart,
        notifiedAt: shouldNotify(match) ? new Date() : null,
      },
    });

    if (!shouldNotify(match)) continue;

    // Notify the *other* post's author: their older post just gained a lead.
    const candidate = candidates.find((c) => c.id === match.candidateId);
    if (!candidate) continue;

    await notifyUnlessSelf(candidate.authorId, source.authorId, "MATCH_FOUND", {
      title: candidate.title,
      body:
        source.type === PostType.FOUND
          ? `Someone posted a found item that looks like yours: “${source.title}”`
          : `Someone is looking for something like the item you found: “${source.title}”`,
      href: `/posts/${source.id}`,
    });
  }

  return top;
}

function shouldNotify(match: ScoredMatch): boolean {
  return match.score >= NOTIFY_THRESHOLD && match.textScore >= MIN_TEXT_TO_NOTIFY;
}

/** Suggestions for a post, in either direction, excluding dismissed ones. */
export async function getMatchesForPost(postId: string) {
  const matches = await db.match.findMany({
    where: {
      dismissedAt: null,
      OR: [{ sourceId: postId }, { candidateId: postId }],
      source: { status: PostStatus.OPEN },
      candidate: { status: PostStatus.OPEN },
    },
    orderBy: { score: "desc" },
    // Over-fetch: a pair can be stored in both directions, so deduplicating
    // below shrinks this list. Taking 5 here would sometimes show only 2 or 3.
    take: 20,
    select: {
      id: true,
      score: true,
      textScore: true,
      daysApart: true,
      categoryHit: true,
      locationHit: true,
      sourceId: true,
      candidateId: true,
      source: { select: { id: true, title: true, type: true, location: true, occurredOn: true } },
      candidate: {
        select: { id: true, title: true, type: true, location: true, occurredOn: true },
      },
    },
  });

  // A Match row is directional, but the suggestion is useful from both ends.
  // Present whichever post isn't the one being viewed.
  //
  // Both directions of a pair usually exist — runMatching stores A->B when A is
  // posted and B->A when B is. That's deliberate in the database, since each row
  // notifies a different author, but on screen it rendered the same item twice.
  // Collapse per counterpart, keeping the higher-scoring row.
  const byOtherPost = new Map<string, (typeof matches)[number] & { otherId: string }>();

  for (const match of matches) {
    const other = match.sourceId === postId ? match.candidate : match.source;
    const existing = byOtherPost.get(other.id);
    if (!existing || match.score > existing.score) {
      byOtherPost.set(other.id, { ...match, otherId: other.id });
    }
  }

  return [...byOtherPost.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((match) => ({
      id: match.id,
      score: match.score,
      textScore: match.textScore,
      daysApart: match.daysApart,
      categoryHit: match.categoryHit,
      locationHit: match.locationHit,
      other: match.sourceId === postId ? match.candidate : match.source,
    }));
}

/**
 * Confidence band, for wording the UI honestly rather than showing a number.
 *
 * Capped when the descriptions don't actually overlap. Two water bottles in the
 * same building in the same week score well on category, place and date, but
 * calling that a "Likely match" oversells it — nothing about the items
 * themselves says they're the same one. Showing it is useful; claiming
 * confidence in it isn't.
 */
export function confidenceLabel(score: number, textScore = 1): string {
  if (textScore < MIN_TEXT_TO_NOTIFY) return "Possible match";
  if (score >= 0.75) return "Strong match";
  if (score >= 0.55) return "Likely match";
  return "Possible match";
}
