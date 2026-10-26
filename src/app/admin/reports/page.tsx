import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Header } from "@/components/Header";
import { formatDay } from "@/components/PostCard";
import { Badge, Button, EmptyState, PageHeader } from "@/components/ui";
import { isModerator } from "@/lib/admin";
import { listOpenReports, REPORT_REASON_LABELS } from "@/lib/reports";
import { requireUser } from "@/lib/session";
import { moderateReport } from "@/app/posts/[id]/actions";

export const metadata: Metadata = { title: "Reports · MacFound" };

export default async function ReportsPage() {
  const user = await requireUser("/admin/reports");

  // 404 rather than 403: a non-moderator shouldn't learn this page exists.
  if (!isModerator(user.email)) notFound();

  const reports = await listOpenReports();

  return (
    <>
      <Header user={user} />

      <main id="main" className="mx-auto w-full max-w-4xl px-4 py-5 md:py-6">
        <PageHeader
          title="Open reports"
          subtitle={reports.length === 0 ? undefined : `${reports.length} waiting`}
        />

        {reports.length === 0 ? (
          <div className="mt-5">
            <EmptyState title="Queue is clear." />
          </div>
        ) : (
          <ul className="mt-5 space-y-3">
            {reports.map((report) => (
              <li key={report.id} className="rounded-card border border-line bg-raised p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="danger">{REPORT_REASON_LABELS[report.reason]}</Badge>
                  <span className="text-xs text-subtle">
                    from {report.reporter.name ?? report.reporter.email} ·{" "}
                    {formatDay(report.createdAt)}
                  </span>
                </div>

                {report.detail && (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-ink">
                    &ldquo;{report.detail}&rdquo;
                  </p>
                )}

                {report.post && (
                  <div className="mt-3 rounded-lg border border-line bg-sunken p-3">
                    <Link href={`/posts/${report.post.id}`} className="font-medium text-ink hover:underline">
                      {report.post.title}
                    </Link>
                    <p className="mt-0.5 text-xs text-subtle">
                      {report.post.type === "FOUND" ? "Found" : "Lost"} · by{" "}
                      {report.post.author.name ?? report.post.author.email} ·{" "}
                      {report.post.status}
                    </p>
                    <p className="mt-1.5 line-clamp-3 text-sm text-muted">
                      {report.post.description}
                    </p>
                    {report.post.images[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={report.post.images[0].url}
                        alt=""
                        className="mt-2 h-24 w-24 rounded-lg object-cover"
                      />
                    )}
                  </div>
                )}

                {report.comment && (
                  <div className="mt-3 rounded-lg border border-line bg-sunken p-3">
                    <p className="text-xs text-subtle">
                      Reply by {report.comment.author.name ?? report.comment.author.email}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-ink">
                      {report.comment.body}
                    </p>
                    <Link
                      href={`/posts/${report.comment.postId}`}
                      className="mt-1 inline-block text-xs font-medium text-brand-text hover:underline"
                    >
                      View post
                    </Link>
                  </div>
                )}

                <div className="mt-3 flex gap-2 border-t border-line pt-3">
                  {report.post && report.post.status !== "REMOVED" && (
                    <form action={moderateReport}>
                      <input type="hidden" name="reportId" value={report.id} />
                      <input type="hidden" name="postId" value={report.post.id} />
                      <input type="hidden" name="action" value="remove" />
                      <Button type="submit" variant="danger" size="sm">
                        Take post down
                      </Button>
                    </form>
                  )}
                  <form action={moderateReport}>
                    <input type="hidden" name="reportId" value={report.id} />
                    <input type="hidden" name="action" value="dismiss" />
                    <Button type="submit" variant="secondary" size="sm">
                      Dismiss
                    </Button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
