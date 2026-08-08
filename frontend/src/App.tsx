import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './lib/auth-context';
import { ThemeProvider } from './lib/theme-context';
import { LanguageProvider } from './lib/language-context';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppShell } from './components/AppShell';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { CoursesPage } from './pages/CoursesPage';
import { CourseDetailPage } from './pages/CourseDetailPage';
import { GradesPage } from './pages/GradesPage';
import { AttendancePage } from './pages/AttendancePage';
import { ExamTakePage } from './pages/ExamTakePage';
import { ExamResultsPage } from './pages/ExamResultsPage';
import { SettingsPage } from './pages/SettingsPage';
import { PortfolioPage } from './pages/PortfolioPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { CareerPage } from './pages/CareerPage';
import { AlumniPage } from './pages/AlumniPage';
import { IdCardPage } from './pages/IdCardPage';
import { LibraryPage } from './pages/LibraryPage';
import { AdminPage } from './pages/AdminPage';
import { ParentPage } from './pages/ParentPage';
import { MessagesPage } from './pages/MessagesPage';
import { MentorsPage } from './pages/MentorsPage';
import { TasksPage } from './pages/TasksPage';

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route
                path="/app"
                element={
                  <ProtectedRoute>
                    <AppShell />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardPage />} />
                <Route path="tasks" element={<TasksPage />} />
                <Route path="mentors" element={<MentorsPage />} />
                <Route path="courses" element={<CoursesPage />} />
                <Route path="courses/:id" element={<CourseDetailPage />} />
                <Route path="grades" element={<GradesPage />} />
                <Route path="attendance" element={<AttendancePage />} />
                <Route path="exams/:id/take" element={<ExamTakePage />} />
                <Route path="exams/:id/results" element={<ExamResultsPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="portfolio" element={<PortfolioPage />} />
                <Route path="leaderboard" element={<LeaderboardPage />} />
                <Route path="career" element={<CareerPage />} />
                <Route path="alumni" element={<AlumniPage />} />
                <Route path="id-card" element={<IdCardPage />} />
                <Route path="library" element={<LibraryPage />} />
                <Route path="admin" element={<AdminPage />} />
                <Route path="parent" element={<ParentPage />} />
                <Route path="messages" element={<MessagesPage />} />
              </Route>
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </LanguageProvider>
    </ThemeProvider>
  );
}
