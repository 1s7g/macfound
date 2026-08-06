import { CampusLocation } from "@/generated/prisma/enums";

/**
 * Campus geography.
 *
 * Coordinates come from OpenStreetMap (Overpass API, queried 2026-08-06), not
 * from anyone's recollection of the campus. This matters: the first version of
 * this file used a hand-written "these buildings are near each other" map, and
 * when it was checked against real coordinates five of its pairs were wrong —
 * MDCL and DBAC were listed as adjacent and are actually 450m apart, and ETB
 * was grouped with the engineering cluster when it sits ~300m south of it.
 *
 * Proximity is now derived, not asserted. Nobody has to hold a mental model of
 * the campus for the matcher to work correctly.
 */

export type Coordinates = { lat: number; lon: number };

/**
 * Buildings with a physical position. Values absent from this map (HSR_BUS,
 * OTHER, UNKNOWN, ...) are intentionally unpositioned — see LOCATION_LABELS
 * for the full enum.
 */
export const LOCATION_COORDINATES: Partial<Record<CampusLocation, Coordinates>> = {
  // Libraries and central campus
  MILLS_LIBRARY: { lat: 43.26276, lon: -79.91764 },
  THODE_LIBRARY: { lat: 43.2611, lon: -79.92258 },
  MUSC: { lat: 43.26347, lon: -79.91781 },
  GILMOUR_HALL: { lat: 43.26344, lon: -79.91824 },
  UNIVERSITY_HALL: { lat: 43.26356, lon: -79.91908 },
  HAMILTON_HALL: { lat: 43.26311, lon: -79.92013 },
  CHESTER_NEW_HALL: { lat: 43.26386, lon: -79.91835 },
  TSH: { lat: 43.26428, lon: -79.9177 },
  KTH: { lat: 43.26414, lon: -79.91695 },
  LRW: { lat: 43.26185, lon: -79.9167 },
  REFECTORY: { lat: 43.26287, lon: -79.92117 },
  THE_HUB: { lat: 43.26504, lon: -79.91719 },

  // Science
  BSB: { lat: 43.26201, lon: -79.9204 },
  ABB: { lat: 43.26075, lon: -79.92188 },
  GSB: { lat: 43.26231, lon: -79.92121 },
  LIFE_SCIENCES: { lat: 43.26097, lon: -79.9179 },
  PSYCHOLOGY: { lat: 43.25967, lon: -79.91953 },
  MDCL: { lat: 43.26107, lon: -79.91686 },
  IAHS: { lat: 43.25959, lon: -79.92073 },

  // Engineering
  JHE: { lat: 43.26075, lon: -79.92043 },
  HATCH: { lat: 43.26031, lon: -79.92017 },
  ETB: { lat: 43.25848, lon: -79.92012 },
  ITB: { lat: 43.25878, lon: -79.92095 },

  // Business
  DSB: { lat: 43.26398, lon: -79.91659 },

  // Athletics
  DBAC: { lat: 43.2651, lon: -79.91627 },
  IVOR_WYNNE: { lat: 43.26552, lon: -79.9151 },
  RON_JOYCE_STADIUM: { lat: 43.2661, lon: -79.91701 },

  // Residences and residence life
  COMMONS_BUILDING: { lat: 43.26555, lon: -79.91929 },
  PGCLL: { lat: 43.26551, lon: -79.91812 },
  LES_PRINCE: { lat: 43.26744, lon: -79.91705 },
  BATES: { lat: 43.26397, lon: -79.92266 },
  BRANDON_HALL: { lat: 43.26594, lon: -79.91984 },
  WOODSTOCK_HALL: { lat: 43.26593, lon: -79.91912 },
  HEDDEN_HALL: { lat: 43.26643, lon: -79.91836 },
  MARY_KEYES: { lat: 43.26272, lon: -79.92272 },
  MATTHEWS_HALL: { lat: 43.26291, lon: -79.92212 },
  MOULTON_HALL: { lat: 43.26341, lon: -79.92214 },
  WALLINGFORD_HALL: { lat: 43.26304, lon: -79.92164 },
  MCKAY_HALL: { lat: 43.26513, lon: -79.91902 },
  WHIDDEN_HALL: { lat: 43.26508, lon: -79.91958 },
  EDWARDS_HALL: { lat: 43.26409, lon: -79.91895 },

  // The main campus transit stop sits at the student centre.
  CAMPUS_BUS_TERMINAL: { lat: 43.26347, lon: -79.91781 },
};

const EARTH_RADIUS_M = 6_371_000;

/** Great-circle distance in metres. */
export function haversineMetres(a: Coordinates, b: Coordinates): number {
  const toRad = Math.PI / 180;
  const lat1 = a.lat * toRad;
  const lat2 = b.lat * toRad;
  const dLat = (b.lat - a.lat) * toRad;
  const dLon = (b.lon - a.lon) * toRad;

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

/** Metres between two campus locations, or null if either is unpositioned. */
export function distanceBetween(
  a: CampusLocation,
  b: CampusLocation,
): number | null {
  const from = LOCATION_COORDINATES[a];
  const to = LOCATION_COORDINATES[b];
  if (!from || !to) return null;
  return haversineMetres(from, to);
}

/**
 * Beyond this, two locations contribute nothing to a match score. Campus is
 * roughly 1km across, so 400m is "same corner of campus" — a plausible walk
 * between dropping something and noticing it's gone.
 */
export const PROXIMITY_CUTOFF_M = 400;

/**
 * Location component of the match score, in [0, 1].
 *
 *   same building            -> 1.0
 *   adjacent (<= ~80m)       -> ~0.9
 *   across campus (>= 400m)  -> 0.0
 *
 * Linear falloff is deliberate: it degrades gracefully when the two people
 * pick neighbouring-but-different buildings for the same place, which an
 * exact-match rule would score as a total miss.
 */
export function locationScore(a: CampusLocation, b: CampusLocation): number {
  if (a === b) return 1;

  const metres = distanceBetween(a, b);
  // Unpositioned values (HSR_BUS, OTHER, UNKNOWN) only match themselves.
  if (metres === null) return 0;
  if (metres >= PROXIMITY_CUTOFF_M) return 0;

  return 1 - metres / PROXIMITY_CUTOFF_M;
}

/**
 * Locations within `radiusM` of `origin`, nearest first, excluding `origin`.
 *
 * NOTE: do not use this to narrow the candidate set for matching. McMaster is
 * only about a kilometre across, so a 400m radius around a central building
 * like Mills covers roughly 80% of campus — it filters out almost nothing while
 * adding a large IN (...) clause. Candidates are narrowed by category, post
 * type and date window instead; location earns its keep in the ranking via
 * locationScore(), not in the WHERE clause.
 *
 * The intended use is UI: "no luck? here are the 5 nearest buildings to check."
 */
export function locationsNear(
  origin: CampusLocation,
  radiusM = 150,
  limit = 5,
): CampusLocation[] {
  if (!LOCATION_COORDINATES[origin]) return [];

  return (Object.keys(LOCATION_COORDINATES) as CampusLocation[])
    .filter((loc) => loc !== origin)
    .map((loc) => ({ loc, metres: distanceBetween(origin, loc) ?? Infinity }))
    .filter(({ metres }) => metres <= radiusM)
    .sort((x, y) => x.metres - y.metres)
    .slice(0, limit)
    .map(({ loc }) => loc);
}
