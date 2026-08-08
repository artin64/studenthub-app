const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

// profileImageUrl etc. come back as relative paths like
// "/uploads/avatars/xyz.jpg" — this turns that into a full URL against
// whichever backend the frontend is currently pointed at.
export function resolveUploadUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${API_URL}${path}`;
}

export type Role = 'STUDENT' | 'PROFESSOR' | 'ADMIN' | 'PARENT' | 'COMPANY';
export type UserStatus = 'PENDING' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  status: UserStatus;
  bio?: string | null;
  profileImageUrl?: string | null;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

async function request<T>(path: string, options: RequestInit = {}, token?: string | null): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch {
    // The backend process itself is unreachable (not running, wrong URL,
    // network down) — this is what "Failed to fetch" looks like in the
    // browser console. A 4xx/5xx from the server never lands here.
    throw new Error(
      `Nuk arrijmë të lidhemi me serverin (${API_URL}). Kontrolloni që backend-i të jetë duke u ekzekutuar dhe që VITE_API_URL në frontend/.env të përputhet me adresën e tij.`,
    );
  }

  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;
    try {
      const body = await res.json();
      if (typeof body.message === 'string') {
        message = body.message;
      } else if (Array.isArray(body.message)) {
        message = body.message.join(', ');
      }
    } catch {
      // keep default message
    }
    throw new Error(message);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'STUDENT' | 'PROFESSOR' | 'PARENT' | 'COMPANY';
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const authApi = {
  // Account is PENDING until a professor/admin approves it — no token yet.
  register: (payload: RegisterPayload) =>
    request<{ message: string; status: UserStatus }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  // Step 1 of login: password only. A 2FA code is emailed; no token yet.
  login: (payload: LoginPayload) =>
    request<{ requiresTwoFactor: true; email: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  // Step 2: the emailed code. Returns real tokens.
  verifyTwoFactor: (email: string, code: string) =>
    request<AuthResponse>('/auth/verify-2fa', { method: 'POST', body: JSON.stringify({ email, code }) }),
  refresh: (refreshToken: string) =>
    request<AuthResponse>('/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken }) }),
  forgotPassword: (email: string) =>
    request<{ message: string }>('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (email: string, token: string, newPassword: string) =>
    request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, token, newPassword }),
    }),
  createStaff: (
    accessToken: string,
    payload: { email: string; password: string; firstName: string; lastName: string; role: 'PROFESSOR' | 'ADMIN' },
  ) => request<Me>('/auth/create-staff', { method: 'POST', body: JSON.stringify(payload) }, accessToken),
};

export interface Me {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  status: UserStatus;
  bio: string | null;
  profileImageUrl: string | null;
  createdAt: string;
}

export interface PendingApproval extends Me {}

export interface PaginatedUsers {
  items: Me[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const usersApi = {
  me: (token: string) => request<Me>('/users/me', {}, token),
  updateProfile: (token: string, payload: { firstName?: string; lastName?: string; bio?: string }) =>
    request<Me>('/users/me', { method: 'PATCH', body: JSON.stringify(payload) }, token),
  uploadPhoto: async (token: string, file: File) => {
    const form = new FormData();
    form.append('photo', file);
    return request<Me>('/users/me/photo', { method: 'POST', body: form }, token);
  },
  changePassword: (token: string, currentPassword: string, newPassword: string) =>
    request(
      '/users/me/change-password',
      { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) },
      token,
    ),
  listPending: (token: string, role?: Role) =>
    request<PendingApproval[]>(`/users/pending${role ? `?role=${role}` : ''}`, {}, token),
  approve: (token: string, id: string) => request<Me>(`/users/${id}/approve`, { method: 'POST' }, token),
  reject: (token: string, id: string, reason?: string) =>
    request<Me>(`/users/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }, token),
  suspend: (token: string, id: string) => request<Me>(`/users/${id}/suspend`, { method: 'POST' }, token),
  reactivate: (token: string, id: string) => request<Me>(`/users/${id}/reactivate`, { method: 'POST' }, token),
  list: (token: string, params: { page?: number; search?: string; role?: Role; status?: UserStatus } = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', String(params.page));
    if (params.search) qs.set('search', params.search);
    if (params.role) qs.set('role', params.role);
    if (params.status) qs.set('status', params.status);
    return request<PaginatedUsers>(`/users?${qs.toString()}`, {}, token);
  },
};

export interface Department {
  id: string;
  name: string;
  faculty?: { id: string; name: string };
}

export interface Course {
  id: string;
  title: string;
  description: string | null;
  professorId: string;
  professor?: { id: string; firstName: string; lastName: string; bio?: string | null; profileImageUrl?: string | null };
  departmentId?: string | null;
  department?: Department | null;
  ectsCredits: number;
  archivedAt?: string | null;
  _count?: { enrollments: number };
  assignments?: Assignment[];
  restricted?: boolean;
}

export interface PaginatedCourses {
  items: Course[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface Assignment {
  id: string;
  title: string;
  description: string | null;
  dueDate: string;
  maxScore: number;
  courseId: string;
  peerReviewEnabled: boolean;
  archivedAt?: string | null;
}

export const coursesApi = {
  list: (token: string, params: { page?: number; search?: string; departmentId?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', String(params.page));
    if (params.search) qs.set('search', params.search);
    if (params.departmentId) qs.set('departmentId', params.departmentId);
    return request<PaginatedCourses>(`/courses?${qs.toString()}`, {}, token);
  },
  mine: (token: string) => request<{ course: Course }[]>('/courses/mine', {}, token),
  create: (token: string, payload: { title: string; description?: string; departmentId?: string; ectsCredits?: number }) =>
    request<Course>('/courses', { method: 'POST', body: JSON.stringify(payload) }, token),
  update: (
    token: string,
    id: string,
    payload: { title?: string; description?: string; departmentId?: string; ectsCredits?: number },
  ) => request<Course>(`/courses/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }, token),
  // Archives the course — nothing is ever hard-deleted. See backend notes.
  remove: (token: string, id: string) => request(`/courses/${id}`, { method: 'DELETE' }, token),
  restore: (token: string, id: string) => request(`/courses/${id}/restore`, { method: 'POST' }, token),
  get: (token: string, id: string) => request<Course>(`/courses/${id}`, {}, token),
  enroll: (token: string, id: string) => request(`/courses/${id}/enroll`, { method: 'POST' }, token),
};

export const assignmentsApi = {
  listForCourse: (token: string, courseId: string) =>
    request<Assignment[]>(`/courses/${courseId}/assignments`, {}, token),
  create: (
    token: string,
    courseId: string,
    payload: { title: string; description?: string; dueDate: string; maxScore?: number; peerReviewEnabled?: boolean },
  ) =>
    request<Assignment>(
      `/courses/${courseId}/assignments`,
      { method: 'POST', body: JSON.stringify(payload) },
      token,
    ),
  update: (
    token: string,
    id: string,
    payload: Partial<{ title: string; description: string; dueDate: string; maxScore: number; peerReviewEnabled: boolean }>,
  ) => request<Assignment>(`/assignments/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }, token),
  remove: (token: string, id: string) => request(`/assignments/${id}`, { method: 'DELETE' }, token),
  submit: (token: string, assignmentId: string, content: string) =>
    request(`/assignments/${assignmentId}/submit`, { method: 'POST', body: JSON.stringify({ content }) }, token),
  submissions: (token: string, assignmentId: string) =>
    request<Submission[]>(`/assignments/${assignmentId}/submissions`, {}, token),
  peerSubmissions: (token: string, assignmentId: string) =>
    request<Submission[]>(`/assignments/${assignmentId}/peer-submissions`, {}, token),
};

export interface Submission {
  id: string;
  content: string;
  status: 'SUBMITTED' | 'REVIEWED';
  submittedAt: string;
  student: { id: string; firstName: string; lastName: string };
  grade: { score: number; feedback: string | null } | null;
}

export interface Grade {
  id: string;
  score: number;
  feedback: string | null;
  gradedAt: string;
  submission: { assignment: { title: string; courseId: string } };
}

export const gradesApi = {
  mine: (token: string) => request<Grade[]>('/grades/mine', {}, token),
  grade: (token: string, submissionId: string, score: number, feedback?: string) =>
    request(
      `/submissions/${submissionId}/grade`,
      { method: 'POST', body: JSON.stringify({ score, feedback }) },
      token,
    ),
};

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export const notificationsApi = {
  list: (token: string) => request<Notification[]>('/notifications', {}, token),
  unreadCount: (token: string) => request<number>('/notifications/unread-count', {}, token),
  markRead: (token: string, id: string) => request(`/notifications/${id}/read`, { method: 'POST' }, token),
  markAllRead: (token: string) => request('/notifications/read-all', { method: 'POST' }, token),
};

export interface StudentAnalytics {
  coursesEnrolled: number;
  assignmentsSubmitted: number;
  averageGrade: number | null;
  attendanceRate: number | null;
  gradesOverTime: { date: string; score: number }[];
}

export interface CourseAnalyticsStudentRow {
  student: { id: string; firstName: string; lastName: string };
  averageGrade: number | null;
  attendanceRate: number | null;
  atRisk: boolean;
}

export interface CourseAnalyticsData {
  enrollmentsCount: number;
  assignmentsCount: number;
  averageGrade: number | null;
  submissionRate: number | null;
  attendanceRate: number | null;
  students: CourseAnalyticsStudentRow[];
}

export interface InstitutionAnalytics {
  usersByRole: { role: string; count: number }[];
  coursesCount: number;
  averageGrade: number | null;
  gradesRecorded: number;
  attendanceSessionsCount: number;
  attendanceCheckIns: number;
}

export const analyticsApi = {
  studentMe: (token: string) => request<StudentAnalytics>('/analytics/student/me', {}, token),
  course: (token: string, courseId: string) =>
    request<CourseAnalyticsData>(`/analytics/courses/${courseId}`, {}, token),
  institution: (token: string) => request<InstitutionAnalytics>('/analytics/institution', {}, token),
};

export async function downloadCourseGradesCsv(token: string, courseId: string) {
  const res = await fetch(`${API_URL}/analytics/courses/${courseId}/grades.csv`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error('Failed to download CSV');
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'grades.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export interface PortfolioItem {
  id: string;
  title: string;
  description: string | null;
  link: string | null;
  createdAt: string;
}

export const portfolioApi = {
  mine: (token: string) => request<PortfolioItem[]>('/portfolio/mine', {}, token),
  create: (token: string, payload: { title: string; description?: string; link?: string }) =>
    request<PortfolioItem>('/portfolio', { method: 'POST', body: JSON.stringify(payload) }, token),
  remove: (token: string, id: string) => request(`/portfolio/${id}`, { method: 'DELETE' }, token),
};

export interface LeaderboardEntry {
  id: string;
  firstName: string;
  lastName: string;
  xp: number;
}

export const gamificationApi = {
  me: (token: string) => request<{ xp: number; level: string }>('/gamification/me', {}, token),
  leaderboard: (token: string) => request<LeaderboardEntry[]>('/gamification/leaderboard', {}, token),
};

export interface Certificate {
  id: string;
  studentId: string;
  courseId: string;
  issuedAt: string;
  course?: { title: string };
  student?: { firstName: string; lastName: string };
}

export const certificatesApi = {
  mine: (token: string) => request<Certificate[]>('/certificates/mine', {}, token),
  forCourse: (token: string, courseId: string) =>
    request<Certificate[]>(`/courses/${courseId}/certificates`, {}, token),
  issue: (token: string, courseId: string, studentId: string) =>
    request(`/courses/${courseId}/certificates`, { method: 'POST', body: JSON.stringify({ studentId }) }, token),
};

export interface JobListing {
  id: string;
  title: string;
  description: string;
  location: string | null;
  createdAt: string;
  company?: { firstName: string; lastName: string };
  _count?: { applications: number };
}

export interface JobApplication {
  id: string;
  message: string | null;
  appliedAt: string;
  student?: { id: string; firstName: string; lastName: string; email: string };
  job?: { id: string; title: string; company?: { firstName: string; lastName: string } };
}

export const jobsApi = {
  list: (token: string) => request<JobListing[]>('/jobs', {}, token),
  mine: (token: string) => request<JobListing[]>('/jobs/mine', {}, token),
  create: (token: string, payload: { title: string; description: string; location?: string }) =>
    request<JobListing>('/jobs', { method: 'POST', body: JSON.stringify(payload) }, token),
  apply: (token: string, jobId: string, message?: string) =>
    request(`/jobs/${jobId}/apply`, { method: 'POST', body: JSON.stringify({ message }) }, token),
  applicants: (token: string, jobId: string) =>
    request<JobApplication[]>(`/jobs/${jobId}/applicants`, {}, token),
  myApplications: (token: string) => request<JobApplication[]>('/jobs/applications/mine', {}, token),
};

export interface CvData {
  user: { firstName: string; lastName: string; email: string } | null;
  summary: string | null;
  skills: string | null;
  portfolio: PortfolioItem[];
  certificates: Certificate[];
  courses: { title: string }[];
}

export const cvApi = {
  mine: (token: string) => request<CvData>('/cv/mine', {}, token),
  update: (token: string, payload: { summary?: string; skills?: string }) =>
    request('/cv/mine', { method: 'PATCH', body: JSON.stringify(payload) }, token),
};

export interface AlumniEntry {
  id: string;
  firstName: string;
  lastName: string;
  alumniCompany: string | null;
  alumniRole: string | null;
}

export const alumniApi = {
  list: (token: string) => request<AlumniEntry[]>('/users/alumni', {}, token),
  update: (token: string, payload: { isAlumnus: boolean; alumniCompany?: string; alumniRole?: string }) =>
    request('/users/me/alumni', { method: 'PATCH', body: JSON.stringify(payload) }, token),
};

export interface LibraryResource {
  id: string;
  title: string;
  author: string | null;
  type: string;
  link: string | null;
  createdAt: string;
}

export const libraryApi = {
  list: (token: string) => request<LibraryResource[]>('/library', {}, token),
  create: (token: string, payload: { title: string; author?: string; type: string; link?: string }) =>
    request<LibraryResource>('/library', { method: 'POST', body: JSON.stringify(payload) }, token),
};

export interface CourseMaterial {
  id: string;
  title: string;
  url: string;
  createdAt: string;
}

export const materialsApi = {
  listForCourse: (token: string, courseId: string) =>
    request<CourseMaterial[]>(`/courses/${courseId}/materials`, {}, token),
  create: (token: string, courseId: string, payload: { title: string; url: string }) =>
    request<CourseMaterial>(
      `/courses/${courseId}/materials`,
      { method: 'POST', body: JSON.stringify(payload) },
      token,
    ),
};

export const ectsApi = {
  mine: (token: string) => request<{ earned: number; inProgress: number }>('/courses/ects/mine', {}, token),
};

export interface Faculty {
  id: string;
  name: string;
  departments: { id: string; name: string }[];
}

export const adminApi = {
  listFaculties: (token: string) => request<Faculty[]>('/faculties', {}, token),
  createFaculty: (token: string, name: string) =>
    request<Faculty>('/faculties', { method: 'POST', body: JSON.stringify({ name }) }, token),
  createDepartment: (token: string, facultyId: string, name: string) =>
    request(`/faculties/${facultyId}/departments`, { method: 'POST', body: JSON.stringify({ name }) }, token),
};

export interface ParentChild {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profileImageUrl?: string | null;
}

export interface ChildOverview {
  courses: { title: string }[];
  averageGrade: number | null;
  recentGrades: { score: number; submission: { assignment: { title: string } } }[];
  totalAttendanceCheckIns: number;
}

export interface ParentLinkRequest {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string | null;
  parent?: { id: string; firstName: string; lastName: string; email: string };
  student?: { id: string; firstName: string; lastName: string; email: string };
}

export const parentApi = {
  children: (token: string) => request<ParentChild[]>('/parent/children', {}, token),
  myRequests: (token: string) => request<ParentLinkRequest[]>('/parent/children/requests', {}, token),
  linkChild: (token: string, studentEmail: string) =>
    request('/parent/children', { method: 'POST', body: JSON.stringify({ studentEmail }) }, token),
  childOverview: (token: string, studentId: string) =>
    request<ChildOverview>(`/parent/children/${studentId}/overview`, {}, token),
  pendingLinkRequests: (token: string) => request<ParentLinkRequest[]>('/parent/link-requests/pending', {}, token),
  approveLink: (token: string, id: string) => request(`/parent/link-requests/${id}/approve`, { method: 'POST' }, token),
  rejectLink: (token: string, id: string, reason?: string) =>
    request(`/parent/link-requests/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }, token),
};

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  read: boolean;
  createdAt: string;
}

export interface ConversationSummary {
  user: { id: string; firstName: string; lastName: string };
  lastMessage: string;
  lastMessageAt: string;
}

export const messagesApi = {
  send: (token: string, receiverId: string, content: string) =>
    request<Message>('/messages', { method: 'POST', body: JSON.stringify({ receiverId, content }) }, token),
  conversations: (token: string) => request<ConversationSummary[]>('/messages/conversations', {}, token),
  withUser: (token: string, userId: string) => request<Message[]>(`/messages/with/${userId}`, {}, token),
  markRead: (token: string, userId: string) =>
    request(`/messages/with/${userId}/read`, { method: 'POST' }, token),
};

export type PostStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ForumPost {
  id: string;
  title: string;
  content: string;
  status: PostStatus;
  rejectionReason?: string | null;
  createdAt: string;
  author?: { id: string; firstName: string; lastName: string; role: Role; profileImageUrl?: string | null };
  _count?: { replies: number };
}

export interface ForumReply {
  id: string;
  content: string;
  createdAt: string;
  author?: { firstName: string; lastName: string; role: Role };
}

export const forumApi = {
  listForCourse: (token: string, courseId: string) =>
    request<ForumPost[]>(`/courses/${courseId}/forum`, {}, token),
  listPending: (token: string, courseId: string) =>
    request<ForumPost[]>(`/courses/${courseId}/forum/pending`, {}, token),
  createPost: (token: string, courseId: string, payload: { title: string; content: string }) =>
    request<ForumPost>(`/courses/${courseId}/forum`, { method: 'POST', body: JSON.stringify(payload) }, token),
  approvePost: (token: string, id: string) => request<ForumPost>(`/forum/${id}/approve`, { method: 'POST' }, token),
  rejectPost: (token: string, id: string, reason?: string) =>
    request<ForumPost>(`/forum/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }, token),
  getPost: (token: string, id: string) =>
    request<ForumPost & { replies: ForumReply[] }>(`/forum/${id}`, {}, token),
  addReply: (token: string, postId: string, content: string) =>
    request<ForumReply>(`/forum/${postId}/replies`, { method: 'POST', body: JSON.stringify({ content }) }, token),
};

export interface ProjectGroup {
  id: string;
  name: string;
  members: { student: { id: string; firstName: string; lastName: string } }[];
}

export const groupsApi = {
  listForCourse: (token: string, courseId: string) =>
    request<ProjectGroup[]>(`/courses/${courseId}/groups`, {}, token),
  create: (token: string, courseId: string, name: string) =>
    request<ProjectGroup>(`/courses/${courseId}/groups`, { method: 'POST', body: JSON.stringify({ name }) }, token),
  join: (token: string, groupId: string) => request(`/groups/${groupId}/join`, { method: 'POST' }, token),
  leave: (token: string, groupId: string) => request(`/groups/${groupId}/leave`, { method: 'DELETE' }, token),
};

export interface PeerReview {
  id: string;
  rating: number;
  comment: string | null;
  reviewer?: { firstName: string; lastName: string };
}

export const peerReviewApi = {
  create: (token: string, submissionId: string, rating: number, comment?: string) =>
    request(
      `/submissions/${submissionId}/reviews`,
      { method: 'POST', body: JSON.stringify({ rating, comment }) },
      token,
    ),
  forSubmission: (token: string, submissionId: string) =>
    request<PeerReview[]>(`/submissions/${submissionId}/reviews`, {}, token),
};

export interface AttendanceSession {
  id: string;
  qrToken: string;
  expiresAt: string;
}

export const attendanceApi = {
  createSession: (token: string, courseId: string, durationMinutes?: number) =>
    request<AttendanceSession>(
      `/courses/${courseId}/attendance/sessions`,
      { method: 'POST', body: JSON.stringify({ durationMinutes }) },
      token,
    ),
  checkIn: (token: string, qrToken: string) =>
    request('/attendance/check-in', { method: 'POST', body: JSON.stringify({ qrToken }) }, token),
  myRate: (token: string, courseId: string) =>
    request<{ totalSessions: number; attended: number; rate: number }>(
      `/courses/${courseId}/attendance/me`,
      {},
      token,
    ),
};

export type QuestionType = 'MULTIPLE_CHOICE' | 'ESSAY';

export interface Exam {
  id: string;
  title: string;
  courseId: string;
  durationMinutes: number;
  startsAt: string;
  endsAt: string;
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
  archivedAt?: string | null;
}

export interface ExamQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  options: string[] | null;
  points: number;
  order: number;
}

export interface ExamAnswer {
  id: string;
  questionId: string;
  selectedOption: number | null;
  essayText: string | null;
}

export interface ExamAttempt {
  id: string;
  submittedAt: string | null;
  score: number | null;
  flagged?: boolean;
  flagReason?: string | null;
  student?: { id: string; firstName: string; lastName: string };
}

export type AntiCheatReason = 'TAB_SWITCH' | 'WINDOW_BLUR' | 'FULLSCREEN_EXIT' | 'COPY_PASTE';

export const examsApi = {
  listForCourse: (token: string, courseId: string) =>
    request<Exam[]>(`/courses/${courseId}/exams`, {}, token),
  create: (
    token: string,
    courseId: string,
    payload: { title: string; durationMinutes: number; startsAt: string; endsAt: string },
  ) => request<Exam>(`/courses/${courseId}/exams`, { method: 'POST', body: JSON.stringify(payload) }, token),
  update: (
    token: string,
    examId: string,
    payload: Partial<{ title: string; durationMinutes: number; startsAt: string; endsAt: string }>,
  ) => request<Exam>(`/exams/${examId}`, { method: 'PATCH', body: JSON.stringify(payload) }, token),
  remove: (token: string, examId: string) => request(`/exams/${examId}`, { method: 'DELETE' }, token),
  addQuestion: (
    token: string,
    examId: string,
    payload: {
      type: QuestionType;
      prompt: string;
      options?: string[];
      correctOption?: number;
      points?: number;
      order?: number;
    },
  ) => request(`/exams/${examId}/questions`, { method: 'POST', body: JSON.stringify(payload) }, token),
  publish: (token: string, examId: string) =>
    request<Exam>(`/exams/${examId}/publish`, { method: 'POST' }, token),
  take: (token: string, examId: string) =>
    request<{ exam: Exam & { questions: ExamQuestion[] }; attempt: { id: string; submittedAt: string | null; answers: ExamAnswer[] } }>(
      `/exams/${examId}/take`,
      {},
      token,
    ),
  answer: (
    token: string,
    examId: string,
    payload: { questionId: string; selectedOption?: number; essayText?: string },
  ) => request(`/exams/${examId}/answer`, { method: 'POST', body: JSON.stringify(payload) }, token),
  submit: (token: string, examId: string) =>
    request<ExamAttempt>(`/exams/${examId}/submit`, { method: 'POST' }, token),
  flag: (token: string, examId: string, reason: AntiCheatReason) =>
    request<ExamAttempt>(`/exams/${examId}/flag`, { method: 'POST', body: JSON.stringify({ reason }) }, token),
  results: (token: string, examId: string) => request<ExamAttempt[]>(`/exams/${examId}/results`, {}, token),
  myResult: (token: string, examId: string) =>
    request<ExamAttempt>(`/exams/${examId}/my-result`, {}, token),
};

export interface Mentor {
  id: string;
  firstName: string;
  lastName: string;
  bio: string | null;
  profileImageUrl: string | null;
  coursesTaught: { id: string; title: string; department?: { name: string } | null }[];
}

export const mentorsApi = {
  list: (token: string, search?: string) =>
    request<Mentor[]>(`/mentors${search ? `?search=${encodeURIComponent(search)}` : ''}`, {}, token),
  detail: (token: string, id: string) => request<Mentor & { coursesTaught: any[] }>(`/mentors/${id}`, {}, token),
};

export interface TaskItem {
  id: string;
  type: string;
  title: string;
  description: string;
  link: string;
  severity: 'info' | 'warning' | 'urgent';
}

export const tasksApi = {
  mine: (token: string) => request<TaskItem[]>('/tasks/mine', {}, token),
};

export const demoRequestsApi = {
  create: (payload: { name: string; email: string; institution?: string; phone?: string; message?: string }) =>
    request<{ id: string }>('/demo-requests', { method: 'POST', body: JSON.stringify(payload) }),
  list: (token: string) =>
    request<
      { id: string; name: string; email: string; institution: string | null; phone: string | null; message: string | null; contacted: boolean; createdAt: string }[]
    >('/demo-requests', {}, token),
  markContacted: (token: string, id: string) => request(`/demo-requests/${id}/contacted`, { method: 'POST' }, token),
};
