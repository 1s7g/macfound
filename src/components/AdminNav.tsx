import Link from "next/link";

const TABS = [
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/stats", label: "Stats" },
] as const;

/**
 * The moderator's three pages as one place: a segmented switch, the same
 * shape as Browse's All / Lost / Found, so it reads as part of the app.
 */
export function AdminNav({ current }: { current: (typeof TABS)[number]["href"] }) {
  return (
    <nav aria-label="Admin" className="grid grid-cols-3 rounded-full bg-sunken p-1 md:mt-5 md:max-w-sm">
      {TABS.map((tab) => {
        const active = tab.href === current;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`flex h-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
              active ? "bg-raised text-ink shadow-card" : "text-muted hover:text-ink"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
