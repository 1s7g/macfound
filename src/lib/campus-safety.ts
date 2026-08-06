import { CampusLocation } from "@/generated/prisma/enums";
import { haversineMetres, LOCATION_COORDINATES, type Coordinates } from "@/lib/campus";

/**
 * The official McMaster lost & found, run by Campus Safety Services.
 *
 * MacFound complements this system rather than competing with it. Roughly half
 * of all found items should end up in an official drop box — this app's job is
 * to reunite people faster than a 30-day shelf does, and to tell someone where
 * the nearest box is when they'd rather hand the item in.
 *
 * Verified against https://css.mcmaster.ca/lost-and-found/ on 2026-08-06.
 * Re-check before launch; hours and drop-box locations change.
 */
export const CAMPUS_SAFETY = {
  name: "Campus Safety Services",
  building: "E.T. Clarke Centre, Room 201",
  address: "1280 Main Street West, Hamilton, ON",
  email: "seclost@mcmaster.ca",
  phone: "905-525-9140 ext. 24281",
  url: "https://css.mcmaster.ca/lost-and-found/",
  /** Items are held this long before disposal — shorter than our post retention. */
  retentionDays: 30,
} as const;

export type DropOffPoint = {
  id: string;
  label: string;
  /** Nearest campus location enum value, for showing the item's context. */
  near: CampusLocation;
  coordinates: Coordinates;
};

/**
 * Staffed desks and drop boxes where found items can be handed in.
 * Coordinates reuse the building positions already in campus.ts.
 */
export const DROP_OFF_POINTS: DropOffPoint[] = [
  {
    id: "musc-compass",
    label: "Student Centre — next to Compass",
    near: "MUSC",
    coordinates: LOCATION_COORDINATES.MUSC!,
  },
  {
    id: "et-clarke",
    label: "E.T. Clarke Centre (main lost & found office)",
    near: "OTHER",
    // E.T. Clarke isn't a pickable post location, so it carries its own point.
    coordinates: { lat: 43.26177, lon: -79.92212 },
  },
  {
    id: "mdcl-lobby",
    label: "MDCL — main lobby",
    near: "MDCL",
    coordinates: LOCATION_COORDINATES.MDCL!,
  },
  {
    id: "dbac-joan-buddle",
    label: "The Pulse — Joan Buddle service desk",
    near: "DBAC",
    coordinates: LOCATION_COORDINATES.DBAC!,
  },
  {
    id: "the-hub",
    label: "The Hub — main lobby",
    near: "THE_HUB",
    coordinates: LOCATION_COORDINATES.THE_HUB!,
  },
];

/**
 * Drop-off points closest to where an item was found, nearest first.
 *
 * Shown on the "I found something" flow: someone who doesn't want to carry a
 * stranger's backpack around campus gets told the nearest box by walking
 * distance instead of having to know the list.
 */
export function nearestDropOffPoints(
  found: CampusLocation,
  limit = 2,
): { point: DropOffPoint; metres: number | null }[] {
  const origin = LOCATION_COORDINATES[found];

  // Unpositioned locations (HSR_BUS, UNKNOWN, ...) can't be ranked by distance,
  // so fall back to the central office rather than an arbitrary ordering.
  if (!origin) {
    const office = DROP_OFF_POINTS.find((p) => p.id === "et-clarke")!;
    return [{ point: office, metres: null }];
  }

  return DROP_OFF_POINTS.map((point) => ({
    point,
    metres: haversineMetres(origin, point.coordinates),
  }))
    .sort((a, b) => a.metres - b.metres)
    .slice(0, limit);
}
