# StudentHub — App e Plotë (Frontend + Backend)

App funksionale lokale me module akademike, siguri të përmirësuar (miratim regjistrimi, 2FA, izolim kursesh), dhe module të reja (Mentorë, Detyrat e mia, Kërkesa Demo). Shih **PROGRESS.md** për listën e plotë, të organizuar sipas hapave origjinalë, çka është kryer dhe çka mbetet.

## Nisja (2 terminale)

**Terminal 1 — Backend**
```
cd backend
cp .env.example .env
# hap .env dhe vendos DATABASE_URL (Postgres duhet të jetë duke punuar)
npm install
npx prisma migrate dev --name security-and-features
npm run start:dev
```
Kontrollo që u nis realisht: `http://localhost:3000/health` duhet të japë `{"status":"ok","database":true}`.

**Terminal 2 — Frontend**
```
cd frontend
cp .env.example .env
npm install
npm run dev
```
App në `http://localhost:5173`

### Nëse merr "Failed to fetch"
1. Kontrollo `http://localhost:3000/health` në browser direkt. Nëse s'hapet fare → backend-i s'është duke punuar (shiko terminalin e backend-it për gabime — zakonisht `DATABASE_URL` gabim ose Postgres jo aktiv).
2. Nëse `/health` hapet por app-i jo → kontrollo `frontend/.env` ka `VITE_API_URL` që përputhet me portin e backend-it.
3. Kontrollo terminalin e backend-it — nëse `npx prisma migrate dev` s'është xhiruar pas ndryshimeve të fundit të schema-s, serveri niset por databaza s'ka tabelat e reja.

## Çka është shtuar në këtë kalim

**Siguri (prioritet):** CORS e kufizuar (jo më e hapur për të gjithë), Swagger vetëm në dev, rate limiting, 2FA me email te hyrja, miratim regjistrimi (nxënës/prind nga mësues+admin; profesor/kompani vetëm admin), izolim i plotë kursesh (`CourseAccessService` — asnjë profesor s'sheh/ndryshon më kursin e një tjetri), regjistrimi si ADMIN nga forma publike i mbyllur.

**Të dhënat s'fshihen kurrë:** "Fshirja" e kurseve/detyrave/provimeve tani arkivon (`archivedAt`), nuk ekzekuton `DELETE` real — asnjë notë, dorëzim, apo certifikatë s'humbet.

**Shkallëzimi:** indekse databaze te pikat më të kërkuara, paginim në lista pa limit më parë (users, courses).

**Feature të reja:** foto profili + bio (të gjitha rolet), miratim lidhjeje prind–nxënës, moderim postimesh në forum, dorëzime private si parazgjedhje (peer review vetëm me leje eksplicite të profesorit + vetëm pasi studenti të ketë dorëzuar vetë), afatet e detyrave zbatohen realisht, fjalëkalim i harruar, rifreskim sesioni automatik, kodi QR në format të dyfishtë (vizual + numerik) me kohëzgjatje të caktueshme, anti-cheat për provime (mbyllje automatike në ndryshim tab-i/dalje nga dritarja), sektori Mentorët, sektori Detyrat e mia, citat ditore motivuese, buton "Book a demo" funksional, gjuha e tretë (Gjermanisht).

## Rolet (5)

STUDENT, PROFESSOR, PARENT, COMPANY regjistrohen nga `/register` — llogaria mbetet **PENDING** deri sa një mësues ose admin ta miratojë (`/app/tasks` ose `/app/admin`). ADMIN krijohet nga një admin ekzistues përmes `POST /auth/create-staff`, jo nga forma publike. Për administratorin e parë të një instance të re, krijoje direkt në databazë (Prisma Studio: `npx prisma studio`) me `role: ADMIN, status: ACTIVE`.

## Shënime të sinqerta (ende të vlefshme)

- **AI** (Tutor/Grading/Advisor), **OAuth**, **S3 storage**: kërkojnë çelësat/llogaritë e tua. Fotot e profilit tani ruhen lokalisht në disk (`backend/uploads/`) — funksionon menjëherë pa S3, por s'shkallëzon mirë për 100k përdorues; migrimi në S3/blob storage mbetet i rekomanduar para prodhimit real.
- **Email real** (2FA, fjalëkalim i harruar, njoftime miratimi): kodi është gati, por pa `SMTP_*` në `.env`, email-et shtypen vetëm në konsolën e backend-it (mënyrë dev). Vendos SMTP real para se ta përdorësh me njerëz të vërtetë.
- **Mobile app** (native): projekt tjetër.
- **Anti-cheat i vërtetë** (lockdown): kërkon app desktop; versioni këtu është zbulim browser-based (ndryshim tab-i/dalje nga dritarja), një pengesë e butë, jo e plotë.
- **Dark mode/i18n**: infrastrukturë e plotë (3 gjuhë: SQ/EN/DE); faqet kryesore (shell, hyrje, regjistrim, dashboard, cilësime, kurse, detyra, mentorë) të përkthyera plotësisht; disa faqe më pak të përdorura (Grades, ExamResults, Portfolio, Leaderboard, Career, Alumni, Library, Messages) ende me tekst anglisht të fiksuar.
- Asgjë s'është testuar nën ngarkesë reale, s'ka penetration testing, s'ka backup automatik të konfiguruar (varet nga hosting-u i Postgres që zgjidhni) — shih `studenthub-production-roadmap.md` dhe `PROGRESS.md` për hartën e plotë drejt prodhimit real me 100,000 studentë.
