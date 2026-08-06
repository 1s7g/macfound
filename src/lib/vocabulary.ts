import { Category, CampusLocation, PostType, PostStatus } from "@/generated/prisma/enums";

// Single source of truth for how enums are rendered. The DB stores the enum;
// every dropdown, badge, and filter reads its label from here, so renaming a
// building is a one-line change instead of a grep-and-pray.

export const CATEGORY_LABELS: Record<Category, string> = {
  ELECTRONICS: "Electronics",
  BAGS: "Bags & Backpacks",
  WATER_BOTTLE: "Water Bottles",
  KEYS_AND_CARDS: "Keys, Cards & Wallets",
  CLOTHING: "Clothing",
  JEWELLERY: "Jewellery",
  BOOKS_AND_NOTES: "Books & Notes",
  SPORTS_EQUIPMENT: "Sports Equipment",
  EYEWEAR: "Glasses & Eyewear",
  OTHER: "Other",
};

export const LOCATION_LABELS: Record<CampusLocation, string> = {
  MILLS_LIBRARY: "Mills Library",
  THODE_LIBRARY: "Thode Library",
  MUSC: "MUSC (Student Centre)",
  ABB: "ABB (Arthur Bourns)",
  JHE: "JHE (John Hodgins Engineering)",
  BSB: "BSB (Burke Science)",
  MDCL: "MDCL (DeGroote Centre for Learning)",
  HATCH: "Hatch Centre",
  TSH: "TSH (Togo Salmon Hall)",
  KTH: "KTH (Kenneth Taylor Hall)",
  ETB: "ETB (Engineering Technology)",
  PGCLL: "PGCLL (Peter George Centre)",
  DBAC: "DBAC / The Pulse",
  IAHS: "IAHS (Applied Health Sciences)",
  LRW: "L.R. Wilson Hall",
  RESIDENCE: "Residence",
  BUS_STOP_OR_TRANSIT: "Bus Stop / Transit",
  OUTDOOR_CAMPUS_GROUNDS: "Outdoor / Campus Grounds",
  OTHER: "Somewhere else on campus",
  UNKNOWN: "Not sure",
};

// Buildings that sit close enough together that an item found in one could
// plausibly have been lost near the other. Used as a softer signal than an
// exact location match in the matching engine.
export const NEARBY_LOCATIONS: Partial<Record<CampusLocation, CampusLocation[]>> = {
  MILLS_LIBRARY: ["MUSC", "KTH", "TSH"],
  MUSC: ["MILLS_LIBRARY", "KTH", "BUS_STOP_OR_TRANSIT"],
  THODE_LIBRARY: ["JHE", "ABB", "HATCH", "ETB"],
  JHE: ["THODE_LIBRARY", "HATCH", "ETB", "ABB"],
  HATCH: ["JHE", "ETB", "THODE_LIBRARY"],
  ETB: ["JHE", "HATCH", "THODE_LIBRARY"],
  ABB: ["THODE_LIBRARY", "BSB", "JHE"],
  BSB: ["ABB", "MDCL", "THODE_LIBRARY"],
  MDCL: ["BSB", "IAHS", "DBAC"],
  IAHS: ["MDCL", "DBAC"],
  KTH: ["TSH", "MILLS_LIBRARY", "MUSC"],
  TSH: ["KTH", "MILLS_LIBRARY", "LRW"],
  LRW: ["TSH", "PGCLL"],
  PGCLL: ["LRW", "RESIDENCE"],
  DBAC: ["MDCL", "IAHS"],
};

export const POST_TYPE_LABELS: Record<PostType, string> = {
  LOST: "Lost",
  FOUND: "Found",
};

export const POST_STATUS_LABELS: Record<PostStatus, string> = {
  OPEN: "Open",
  RESOLVED: "Reunited",
  EXPIRED: "Expired",
  REMOVED: "Removed",
};

// Ordered lists for rendering dropdowns.
export const CATEGORIES = Object.keys(CATEGORY_LABELS) as Category[];
export const LOCATIONS = Object.keys(LOCATION_LABELS) as CampusLocation[];

// Open posts auto-expire after this long. Keeps the feed honest and makes the
// "reunited" rate a meaningful number rather than a trickle against a backlog.
export const POST_RETENTION_DAYS = 60;
