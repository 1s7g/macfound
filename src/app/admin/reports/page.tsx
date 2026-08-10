import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Header } from "@/components/Header";
import { formatDay } from "@/components/PostCard";
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

      <main className="mx-auto w-full max-w-3xl px-4 py-6">
        <h1 className="text-xl font-semibold tracking-tight text-ink">
          Open reports
        </h1>
        <p className="mt-0.5 text-sm text-subtle">
          {reports.length === 0 ? "Queue is clear." : `${reports.length} waiting`}
        </p>

        {reports.length === 0 ? (
          <p className="mt-6 rounded-xl border border-dashed border-line-strong bg-raised p-8 text-center text-muted">
            Nothing to review.
          </p>
        ) : (
          <ul className="mt-5 space-y-3">
            {reports.map((report) => (
              <li key={report.id} className="rounded-xl border border-line bg-raised p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-danger-subtle px-2.5 py-0.5 text-xs font-medium text-danger">
                    {REPORT_REASON_LABELS[report.reason]}
                  </span>
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
                      <button
                        type="submit"
                        className="rounded-lg bg-danger px-3.5 py-1.5 text-sm font-medium text-white transition hover:opacity-90"
                      >
                        Take post down
                      </button>
                    </form>
                  )}
                  <form action={moderateReport}>
                    <input type="hidden" name="reportId" value={report.id} />
                    <input type="hidden" name="action" value="dismiss" />
                    <button
                      type="submit"
                      className="rounded-lg border border-line-strong px-3.5 py-1.5 text-sm font-medium text-ink transition hover:bg-sunken"
                    >
                      Dismiss
                    </button>
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
