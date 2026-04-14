import { prisma } from "@/lib/db";

const statusColors: Record<string, string> = {
  open: "bg-emerald-100 text-emerald-800",
  filled: "bg-blue-100 text-blue-800",
  archived: "bg-zinc-100 text-zinc-500",
};

const sourceColors: Record<string, string> = {
  email: "bg-red-100 text-red-700",
  manual: "bg-zinc-100 text-zinc-600",
  slack: "bg-violet-100 text-violet-700",
};

export default async function JobsPage() {
  const jobs = await prisma.job.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Jobs</h1>
          <p className="text-sm text-muted mt-1">
            {jobs.length} opportunities shared with the community
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href="/inbox"
            className="text-sm font-medium px-4 py-2.5 rounded-lg border border-border text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            Intake via Email
          </a>
        </div>
      </div>

      {jobs.length === 0 ? (
        <div className="bg-card-bg border border-border rounded-xl p-12 text-center">
          <p className="text-sm text-muted">No jobs yet.</p>
          <p className="text-xs text-muted mt-1">
            Forward a job email (with &ldquo;job&rdquo; in the subject) to{" "}
            <span className="font-mono text-accent">emma@mycacollective.com</span> to add one.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map((job) => (
            <div key={job.id} className="bg-card-bg border border-border rounded-xl p-5">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900">{job.title}</h3>
                  {job.company && <p className="text-xs text-zinc-600">{job.company}</p>}
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[job.status]}`}>
                  {job.status}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                {job.location && (
                  <span className="text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded">{job.location}</span>
                )}
                {job.salary && (
                  <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">{job.salary}</span>
                )}
                {job.source && (
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${sourceColors[job.source] || "bg-zinc-100 text-zinc-600"}`}>
                    via {job.source}
                  </span>
                )}
              </div>

              {job.description && (
                <p className="text-xs text-zinc-600 mb-3 line-clamp-3 whitespace-pre-wrap">
                  {job.description}
                </p>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-border text-xs">
                <div className="text-muted">
                  {job.contactName && <span>Referred by: <span className="text-zinc-700">{job.contactName}</span></span>}
                </div>
                {job.applyUrl && (
                  <a
                    href={job.applyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent font-medium hover:underline"
                  >
                    Apply →
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
