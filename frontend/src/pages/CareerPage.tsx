import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../lib/auth-context';
import {
  jobsApi,
  cvApi,
  type JobListing,
  type JobApplication,
  type CvData,
} from '../lib/api';

const cardClass = 'rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-surface-darkCard';
const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 dark:border-gray-700 dark:bg-surface-dark dark:text-white';

function StudentCareerView() {
  const { token } = useAuth();
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [myApplications, setMyApplications] = useState<JobApplication[]>([]);
  const [cv, setCv] = useState<CvData | null>(null);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState('');
  const [skills, setSkills] = useState('');
  const [savingCv, setSavingCv] = useState(false);

  const load = async () => {
    if (!token) return;
    const [jobList, applications, cvData] = await Promise.all([
      jobsApi.list(token),
      jobsApi.myApplications(token),
      cvApi.mine(token),
    ]);
    setJobs(jobList);
    setMyApplications(applications);
    setCv(cvData);
    setSummary(cvData.summary ?? '');
    setSkills(cvData.skills ?? '');
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [token]);

  const appliedJobIds = new Set(myApplications.map((a) => a.job?.id));

  const onApply = async (jobId: string) => {
    if (!token) return;
    await jobsApi.apply(token, jobId);
    await load();
  };

  const onSaveCv = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSavingCv(true);
    try {
      await cvApi.update(token, { summary, skills });
    } finally {
      setSavingCv(false);
    }
  };

  if (loading) return <p className="text-sm text-gray-400 dark:text-gray-500">Loading…</p>;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Your CV</h2>
        <form onSubmit={onSaveCv} className={`mt-3 space-y-3 ${cardClass}`}>
          <textarea
            placeholder="Professional summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={2}
            className={inputClass}
          />
          <input
            placeholder="Skills (comma-separated)"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            className={inputClass}
          />
          <button
            type="submit"
            disabled={savingCv}
            className="rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60 dark:bg-white dark:text-gray-900"
          >
            {savingCv ? 'Saving…' : 'Save CV'}
          </button>
          {cv && (
            <div className="border-t border-gray-100 pt-3 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
              {cv.portfolio.length} project(s) · {cv.certificates.length} certificate(s) · {cv.courses.length}{' '}
              course(s) — pulled in automatically
            </div>
          )}
        </form>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Open positions</h2>
        {jobs.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">No listings yet.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {jobs.map((job) => (
              <div key={job.id} className={cardClass}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{job.title}</p>
                    <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                      {job.company ? `${job.company.firstName} ${job.company.lastName}` : ''}
                      {job.location ? ` · ${job.location}` : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => onApply(job.id)}
                    disabled={appliedJobIds.has(job.id)}
                    className="rounded-full bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {appliedJobIds.has(job.id) ? 'Applied' : 'Apply'}
                  </button>
                </div>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{job.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CompanyCareerView() {
  const { token } = useAuth();
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [posting, setPosting] = useState(false);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [applicants, setApplicants] = useState<JobApplication[]>([]);

  const load = async () => {
    if (!token) return;
    const mine = await jobsApi.mine(token);
    setJobs(mine);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [token]);

  const onPost = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setPosting(true);
    try {
      await jobsApi.create(token, { title, description, location: location || undefined });
      setTitle('');
      setDescription('');
      setLocation('');
      await load();
    } finally {
      setPosting(false);
    }
  };

  const onToggle = async (jobId: string) => {
    if (expandedJobId === jobId) {
      setExpandedJobId(null);
      return;
    }
    setExpandedJobId(jobId);
    if (token) {
      const list = await jobsApi.applicants(token, jobId);
      setApplicants(list);
    }
  };

  if (loading) return <p className="text-sm text-gray-400 dark:text-gray-500">Loading…</p>;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Post a position</h2>
        <form onSubmit={onPost} className={`mt-3 space-y-3 ${cardClass}`}>
          <input
            required
            placeholder="Job title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass}
          />
          <textarea
            required
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className={inputClass}
          />
          <input
            placeholder="Location (optional)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className={inputClass}
          />
          <button
            type="submit"
            disabled={posting}
            className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {posting ? 'Posting…' : 'Post job'}
          </button>
        </form>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Your postings</h2>
        {jobs.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">No postings yet.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {jobs.map((job) => (
              <div key={job.id} className={cardClass}>
                <button onClick={() => onToggle(job.id)} className="flex w-full items-center justify-between text-left">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{job.title}</p>
                    <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                      {job._count?.applications ?? 0} applicant(s)
                    </p>
                  </div>
                  <span className="text-xs text-gray-400">{expandedJobId === job.id ? 'Hide' : 'View'}</span>
                </button>
                {expandedJobId === job.id && (
                  <div className="mt-3 space-y-2 border-t border-gray-100 pt-3 dark:border-gray-800">
                    {applicants.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400">No applicants yet.</p>
                    ) : (
                      applicants.map((a) => (
                        <div key={a.id} className="rounded-xl bg-gray-50 p-3 dark:bg-white/5">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {a.student?.firstName} {a.student?.lastName}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">{a.student?.email}</p>
                          {a.message && <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{a.message}</p>}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function CareerPage() {
  const { user } = useAuth();

  return (
    <div>
      <p className="text-sm text-gray-400 dark:text-gray-500">Career</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">Career Hub</h1>
      <div className="mt-8">
        {user?.role === 'COMPANY' ? <CompanyCareerView /> : <StudentCareerView />}
      </div>
    </div>
  );
}
