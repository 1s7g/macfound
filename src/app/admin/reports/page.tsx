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
        <h1 className="text-xl font-semibold tracking-tight text-stone-900">
          Open reports
        </h1>
        <p className="mt-0.5 text-sm text-stone-500">
          {reports.length === 0 ? "Queue is clear." : `${reports.length} waiting`}
        </p>

        {reports.length === 0 ? (
          <p className="mt-6 rounded-xl border border-dashed border-stone-300 bg-white p-8 text-center text-stone-600">
            Nothing to review.
          </p>
        ) : (
          <ul className="mt-5 space-y-3">
            {reports.map((report) => (
              <li key={report.id} className="rounded-xl border border-stone-200 bg-white p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                    {REPORT_REASON_LABELS[report.reason]}
                  </span>
                  <span className="text-xs text-stone-500">
                    from {report.reporter.name ?? report.reporter.email} ·{" "}
                    {formatDay(report.createdAt)}
                  </span>
                </div>

                {report.detail && (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-stone-700">
                    &ldquo;{report.detail}&rdquo;
                  </p>
                )}

                {report.post && (
                  <div className="mt-3 rounded-lg border border-stone-200 bg-stone-50 p-3">
                    <Link href={`/posts/${report.post.id}`} className="font-medium text-stone-900 hover:underline">
                      {report.post.title}
                    </Link>
                    <p className="mt-0.5 text-xs text-stone-500">
                      {report.post.type === "FOUND" ? "Found" : "Lost"} · by{" "}
                      {report.post.author.name ?? report.post.author.email} ·{" "}
                      {report.post.status}
                    </p>
                    <p className="mt-1.5 line-clamp-3 text-sm text-stone-600">
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
                  <div className="mt-3 rounded-lg border border-stone-200 bg-stone-50 p-3">
                    <p className="text-xs text-stone-500">
                      Reply by {report.comment.author.name ?? report.comment.author.email}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-stone-700">
                      {report.comment.body}
                    </p>
                    <Link
                      href={`/posts/${report.comment.postId}`}
                      className="mt-1 inline-block text-xs font-medium text-brand hover:underline"
                    >
                      View post
                    </Link>
                  </div>
                )}

                <div className="mt-3 flex gap-2 border-t border-stone-100 pt-3">
                  {report.post && report.post.status !== "REMOVED" && (
                    <form action={moderateReport}>
                      <input type="hidden" name="reportId" value={report.id} />
                      <input type="hidden" name="postId" value={report.post.id} />
                      <input type="hidden" name="action" value="remove" />
                      <button
                        type="submit"
                        className="rounded-lg bg-red-700 px-3.5 py-1.5 text-sm font-medium text-white transition hover:bg-red-800"
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
                      className="rounded-lg border border-stone-300 px-3.5 py-1.5 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
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
