import type { ReportReason } from "@/generated/prisma/enums";

/**
 * Report reasons, kept in their own module with no database import.
 *
 * The report form is a client component, and anything it imports gets bundled
 * for the browser. When these lived in lib/reports.ts — which imports db, and
 * so @prisma/adapter-pg, and so pg — the build tried to resolve Node's `dns`
 * in the browser and the page 500'd. Enums and labels are safe to ship to the
 * client; query functions are not.
 */
export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  SPAM: "Spam or advertising",
  HARASSMENT: "Harassment or abuse",
  SCAM_OR_FALSE_CLAIM: "Scam or a false claim of ownership",
  PERSONAL_INFO: "Shows personal information (ID, card, documents)",
  OTHER: "Something else",
};

export const REPORT_REASONS = Object.keys(REPORT_REASON_LABELS) as ReportReason[];
