import "dotenv/config";

import { db } from "../src/lib/db";
import { parseLocalDate } from "../src/lib/posts";

/**
 * Development seed data.
 *
 * Realistic enough to exercise the feeds, filters and (soon) the matcher —
 * several of these pairs are deliberately the same item posted from both
 * sides, at nearby-but-different buildings, so proximity scoring has something
 * meaningful to work on.
 */

const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toLocaleDateString("en-CA");
};

const POSTS = [
  { type: "LOST", title: "Black Hydro Flask, covered in stickers", description: "Dark navy 32oz Hydro Flask, dented near the bottom. Stickers from MacEng and a Spotify one. Left it at a study table.", category: "WATER_BOTTLE", location: "MILLS_LIBRARY", locationDetail: "4th floor quiet zone", occurredOn: daysAgo(2) },
  { type: "FOUND", title: "Navy metal water bottle with stickers", description: "Found a dark blue insulated bottle on a desk after class. Has a bunch of stickers on it. Holding onto it for now.", category: "WATER_BOTTLE", location: "MUSC", locationDetail: "near Compass", occurredOn: daysAgo(1), secretDetail: "a faded Spotify sticker is stuck under the lid, half peeled off" },
  { type: "LOST", title: "AirPods Pro case, no earbuds inside", description: "White AirPods Pro charging case. Scuffed on one corner. Probably fell out of my hoodie pocket.", category: "ELECTRONICS", location: "THODE_LIBRARY", locationDetail: "basement study rooms", occurredOn: daysAgo(4) },
  { type: "FOUND", title: "Student card — first name Priya", description: "Found a McMaster student card on the floor by the stairs. Handed it to the desk but posting here in case they check.", category: "KEYS_AND_CARDS", location: "JHE", occurredOn: daysAgo(3), secretDetail: "student number ends 4471" },
  { type: "LOST", title: "Grey North Face backpack", description: "Grey and black North Face Borealis. Has a calculus textbook, a charger and a blue notebook inside. Really need the notebook back.", category: "BAGS", location: "BSB", locationDetail: "lecture hall B135", occurredOn: daysAgo(1) },
  { type: "FOUND", title: "Set of keys with a red carabiner", description: "Three keys on a red carabiner with a small bottle opener. Found on a bench outside.", category: "KEYS_AND_CARDS", location: "OUTDOOR_CAMPUS_GROUNDS", occurredOn: daysAgo(5), secretDetail: "a small Goodlife tag on the ring, blue and scratched" },
  { type: "LOST", title: "Prescription glasses, tortoiseshell frames", description: "Brown tortoiseshell frames in a black case. Lost somewhere between the gym and my res.", category: "EYEWEAR", location: "DBAC", occurredOn: daysAgo(6) },
  { type: "FOUND", title: "Textbook — Introduction to Psychology", description: "Someone left a psych textbook in the lecture hall. Name written inside the front cover.", category: "BOOKS_AND_NOTES", location: "PSYCHOLOGY", locationDetail: "room 155", occurredOn: daysAgo(2), secretDetail: "the name 'A. Nguyen' in blue pen inside the front cover" },
  { type: "LOST", title: "Silver ring, sentimental", description: "Thin silver band with a small engraving on the inside. Took it off while washing my hands and forgot it.", category: "JEWELLERY", location: "MDCL", locationDetail: "second floor washroom", occurredOn: daysAgo(8) },
  { type: "FOUND", title: "Blue umbrella left on the bus", description: "Someone left a compact blue umbrella on the 51. Brought it to campus with me.", category: "OTHER", location: "HSR_BUS", occurredOn: daysAgo(1) },
  { type: "LOST", title: "Laptop charger — Dell 65W", description: "Black Dell charger with a white cable tie around it. Left it plugged in under a desk.", category: "ELECTRONICS", location: "ITB", locationDetail: "computer lab", occurredOn: daysAgo(3) },
  { type: "FOUND", title: "Green Jansport backpack in the Refectory", description: "Green Jansport left under a table at lunch. Didn't open it beyond checking for a name.", category: "BAGS", location: "REFECTORY", occurredOn: daysAgo(2), secretDetail: "a small plastic frog keychain on the zip" },
] as const;

async function main() {
  const author = await db.user.upsert({
    where: { email: "seed@mcmaster.ca" },
    update: {},
    create: { email: "seed@mcmaster.ca", name: "seed", emailVerified: new Date() },
    select: { id: true },
  });

  await db.post.deleteMany({ where: { authorId: author.id } });

  for (const post of POSTS) {
    await db.post.create({
      data: {
        authorId: author.id,
        type: post.type,
        title: post.title,
        description: post.description,
        category: post.category,
        location: post.location,
        locationDetail: "locationDetail" in post ? post.locationDetail : null,
        occurredOn: parseLocalDate(post.occurredOn),
        secretDetail: "secretDetail" in post ? post.secretDetail : null,
      },
    });
  }

  const [lost, found] = await Promise.all([
    db.post.count({ where: { type: "LOST" } }),
    db.post.count({ where: { type: "FOUND" } }),
  ]);
  console.log(`Seeded ${lost} lost and ${found} found posts.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => process.exit(0));
