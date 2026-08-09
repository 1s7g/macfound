import "dotenv/config";

import { db } from "../src/lib/db";
import { confidenceLabel, runMatching } from "../src/lib/matching";

/**
 * Re-runs the matcher over every open post and prints what it found.
 *
 * Scoring weights are judgement calls, and the only honest way to tune them is
 * to look at real pairs and ask whether the ranking is sensible. Run this after
 * changing a weight or a threshold:  npm run match:report
 */
async function main() {
  await db.match.deleteMany({});

  const posts = await db.post.findMany({
    where: { status: "OPEN" },
    select: { id: true, type: true, title: true },
    orderBy: { createdAt: "asc" },
  });

  const titles = new Map(posts.map((p) => [p.id, `[${p.type}] ${p.title}`]));

  for (const post of posts) {
    const matches = await runMatching(post.id);
    if (!matches.length) continue;

    console.log(`\n[${post.type}] ${post.title}`);
    for (const m of matches) {
      console.log(
        `   ${m.score.toFixed(2)}  ${confidenceLabel(m.score, m.textScore).padEnd(15)}` +
          `text=${m.textScore.toFixed(2)} cat=${m.categoryHit ? "Y" : "n"} ` +
          `loc=${m.locationHit ? "Y" : "n"} ${String(m.daysApart).padStart(2)}d  ` +
          `-> ${titles.get(m.candidateId) ?? m.candidateId}`,
      );
    }
  }

  const total = await db.match.count();
  const notified = await db.match.count({ where: { notifiedAt: { not: null } } });
  console.log(`\n${total} match rows stored; ${notified} strong enough to notify.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => process.exit(0));
