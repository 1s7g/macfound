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

// Labels lean toward what students actually say, with the formal name in
// parentheses only where the abbreviation alone would be ambiguous.
export const LOCATION_LABELS: Record<CampusLocation, string> = {
  // Libraries and central campus
  MILLS_LIBRARY: "Mills Library",
  THODE_LIBRARY: "Thode Library",
  MUSC: "MUSC",
  GILMOUR_HALL: "Gilmour Hall",
  UNIVERSITY_HALL: "University Hall",
  HAMILTON_HALL: "Hamilton Hall",
  CHESTER_NEW_HALL: "Chester New Hall",
  TSH: "TSH (Togo Salmon Hall)",
  KTH: "KTH (Kenneth Taylor Hall)",
  LRW: "L.R. Wilson Hall",
  // Nobody calls this building "the Refectory" — they name the venues inside it.
  REFECTORY: "The Phoenix / Bridges Café",
  THE_HUB: "The Hub",

  // Science
  BSB: "BSB (Burke Science)",
  ABB: "ABB (Arthur Bourns)",
  GSB: "GSB (General Sciences)",
  LIFE_SCIENCES: "Life Sciences Building",
  PSYCHOLOGY: "Psychology Building",
  MDCL: "MDCL",
  IAHS: "IAHS (Applied Health Sciences)",

  // Engineering
  JHE: "JHE (John Hodgins)",
  HATCH: "Hatch Centre",
  ETB: "ETB (Engineering Technology)",
  ITB: "ITB (Information Technology)",

  // Business
  DSB: "DeGroote School of Business",

  // Athletics
  DBAC: "The Pulse (DBAC)",
  IVOR_WYNNE: "Ivor Wynne Centre",
  RON_JOYCE_STADIUM: "Ron Joyce Stadium",

  // Residences and residence life
  COMMONS_BUILDING: "Commons Building",
  PGCLL: "PGCLL (Peter George Centre)",
  LES_PRINCE: "Les Prince Hall",
  BATES: "Bates Residence",
  BRANDON_HALL: "Brandon Hall",
  WOODSTOCK_HALL: "Woodstock Hall",
  HEDDEN_HALL: "Hedden Hall",
  MARY_KEYES: "Mary Keyes Residence",
  MATTHEWS_HALL: "Matthews Hall",
  MOULTON_HALL: "Moulton Hall",
  WALLINGFORD_HALL: "Wallingford Hall",
  MCKAY_HALL: "McKay Hall",
  WHIDDEN_HALL: "Whidden Hall",
  EDWARDS_HALL: "Edwards Hall",

  // Off-campus and unpositioned
  HSR_BUS: "HSR Bus",
  CAMPUS_BUS_TERMINAL: "Campus Bus Terminal",
  OUTDOOR_CAMPUS_GROUNDS: "Outdoors on campus",
  OTHER: "Somewhere else on campus",
  UNKNOWN: "Not sure",
};

// Grouping for the location picker. ~40 options is too many for a flat
// <select> on a phone, so the UI renders a grouped, searchable combobox.
export const LOCATION_GROUPS: { label: string; locations: CampusLocation[] }[] = [
  {
    label: "Libraries & Central Campus",
    locations: [
      "MILLS_LIBRARY", "THODE_LIBRARY", "MUSC", "GILMOUR_HALL", "UNIVERSITY_HALL",
      "HAMILTON_HALL", "CHESTER_NEW_HALL", "TSH", "KTH", "LRW", "REFECTORY", "THE_HUB",
    ],
  },
  {
    label: "Science & Health",
    locations: ["BSB", "ABB", "GSB", "LIFE_SCIENCES", "PSYCHOLOGY", "MDCL", "IAHS"],
  },
  { label: "Engineering", locations: ["JHE", "HATCH", "ETB", "ITB"] },
  { label: "Business", locations: ["DSB"] },
  { label: "Athletics", locations: ["DBAC", "IVOR_WYNNE", "RON_JOYCE_STADIUM"] },
  {
    label: "Residence",
    locations: [
      "COMMONS_BUILDING", "PGCLL", "LES_PRINCE", "BATES", "BRANDON_HALL",
      "WOODSTOCK_HALL", "HEDDEN_HALL", "MARY_KEYES", "MATTHEWS_HALL",
      "MOULTON_HALL", "WALLINGFORD_HALL", "MCKAY_HALL", "WHIDDEN_HALL", "EDWARDS_HALL",
    ],
  },
  {
    label: "Transit & Other",
    locations: ["HSR_BUS", "CAMPUS_BUS_TERMINAL", "OUTDOOR_CAMPUS_GROUNDS", "OTHER", "UNKNOWN"],
  },
];

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
