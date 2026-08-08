# StudentHub — Frontend

React + TypeScript + Tailwind + Framer Motion. Landing page (public) + a working authenticated app (login, register, dashboard, courses, assignments, attendance, grades) wired to the real backend API.

## Si ta nisësh

1. Sigurohu që backend-i (`../backend`) është duke punuar në `http://localhost:3000`
2. Kopjo `.env.example` në `.env` (default-i `VITE_API_URL=http://localhost:3000` funksionon nëse s'ke ndryshuar port-in e backend-it)
3. `npm install`
4. `npm run dev`
5. Hap `http://localhost:5173`

## Rrjedha e testimit

1. `/register` — krijo një llogari **Professor**, krijo një kurs
2. Dil, `/register` përsëri — krijo një llogari **Student**
3. Si student: shko te "Courses", regjistrohu (Enroll) në kursin
4. Kthehu si professor: hap kursin, gjenero sesion vijueshmërie (QR token si tekst), krijo një detyrë
5. Si student: hap kursin, "Check in" me token-in e kopjuar, dorëzo detyrën
6. Si professor: hap detyrën, jep notë dorëzimit
7. Si student: shiko "Grades" — nota duhet të shfaqet

## Struktura

```
src/
  pages/        LandingPage, LoginPage, RegisterPage, DashboardPage,
                CoursesPage, CourseDetailPage, GradesPage, AttendancePage
  lib/          api.ts (klient i plotë API), auth-context.tsx (JWT + user state)
  components/   NavBar, Hero, AcademicCycle, Features, AudienceSection,
                IntelligenceSpotlight, Plans, FinalCta, Footer, Reveal,
                Logomark, ProtectedRoute, AppShell
  data/         content.ts — përmbajtja e landing page-s
```

## Çfarë ndryshoi nga versioni vetëm-landing

- Shtuar routing (`react-router-dom`): `/`, `/login`, `/register`, `/app/*`
- Shtuar `AuthProvider` — token JWT në `localStorage`, sesion i ruajtur mes rifreskimeve
- Shtuar `ProtectedRoute` — `/app/*` kërkon login
- Butonat "Get Started" / "Log in" në landing page tani lidhen realisht me `/register` / `/login`

## Çfarë NUK mbulon ende

AI Tutor, provime të sigurta, career hub, portofoli, dark mode, deployment — shih `studenthub-production-roadmap.md`.
