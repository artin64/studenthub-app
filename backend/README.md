# StudentHub — Backend API

Themeli i backend-it real: NestJS + PostgreSQL (Prisma) + autentikim JWT me role. Mbulon gjashtë module bazë: Auth, Users, Courses, Assignments, Attendance (QR), Grades — skeleti mbi të cilin ndërtohen modulet e tjera.

## Si ta nisësh

1. Instalo PostgreSQL lokalisht (ose përdor një shërbim si Neon/Supabase/Railway)
2. Kopjo `.env.example` në `.env` dhe vendos `DATABASE_URL` tënde
3. `npm install`
4. `npx prisma migrate dev --name init`
5. `npm run start:dev`

API në `http://localhost:3000`, dokumentacioni Swagger në `http://localhost:3000/docs`.

## Struktura

```
prisma/schema.prisma   modeli i të dhënave
src/
  auth/                regjistrim, login, JWT
  users/
  courses/              kurse + regjistrim studentësh
  assignments/          detyra + dorëzime
  attendance/            sesione QR + check-in
  grades/                vlerësim i dorëzimeve
  common/                guards, decorators, filter gabimesh
  prisma/                Prisma service (global)
```

## Rolet

STUDENT, PROFESSOR, ADMIN, PARENT — çdo endpoint i mbrojtur kontrollon rolin me `@Roles()`.

## Çfarë MBULON kjo fazë

- Regjistrim/login me role
- Krijim/regjistrim në kurse
- Krijim detyrash + dorëzim + notim
- Vijueshmëri me QR token që skadon
- Notat e studentit

## Çfarë NUK mbulon (ende)

- AI Tutor/Grading/Exam Generator (kërkon integrim real me API + kosto)
- Provimet online të sigurta (secure exam mode)
- Portofoli, gamifikimi, career hub, njoftimet
- Deployment, monitoring, rate limiting në prodhim, teste automatike
- Penetration testing dhe review ligjor për të dhënat e nxënësve mbeten të domosdoshme para çdo lançimi real — shih `studenthub-production-roadmap.md`
