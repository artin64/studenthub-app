import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { MailModule } from './common/mail/mail.module';
import { CourseAccessModule } from './common/access/course-access.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CoursesModule } from './courses/courses.module';
import { AssignmentsModule } from './assignments/assignments.module';
import { AttendanceModule } from './attendance/attendance.module';
import { GradesModule } from './grades/grades.module';
import { ExamsModule } from './exams/exams.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { PortfolioModule } from './portfolio/portfolio.module';
import { GamificationModule } from './gamification/gamification.module';
import { CertificatesModule } from './certificates/certificates.module';
import { JobsModule } from './jobs/jobs.module';
import { CvModule } from './cv/cv.module';
import { DepartmentsModule } from './departments/departments.module';
import { LibraryModule } from './library/library.module';
import { MaterialsModule } from './materials/materials.module';
import { ParentModule } from './parent/parent.module';
import { MessagesModule } from './messages/messages.module';
import { ForumModule } from './forum/forum.module';
import { GroupsModule } from './groups/groups.module';
import { PeerReviewModule } from './peer-review/peer-review.module';
import { TasksModule } from './tasks/tasks.module';
import { MentorsModule } from './mentors/mentors.module';
import { DemoRequestsModule } from './demo-requests/demo-requests.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Rate limiting: 100 requests / minute per IP by default across the
    // whole API, plus a stricter override on auth endpoints (see
    // auth.controller.ts) to slow down password/2FA guessing. This alone
    // will not survive a real DDoS, but it stops a single misbehaving
    // client or script from hammering the API and starving everyone else —
    // relevant the moment this is reachable by 100k real users.
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    MailModule,
    CourseAccessModule,
    AuthModule,
    UsersModule,
    CoursesModule,
    AssignmentsModule,
    AttendanceModule,
    GradesModule,
    ExamsModule,
    NotificationsModule,
    AnalyticsModule,
    PortfolioModule,
    GamificationModule,
    CertificatesModule,
    JobsModule,
    CvModule,
    DepartmentsModule,
    LibraryModule,
    MaterialsModule,
    ParentModule,
    MessagesModule,
    ForumModule,
    GroupsModule,
    PeerReviewModule,
    TasksModule,
    MentorsModule,
    DemoRequestsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
  controllers: [HealthController],
})
export class AppModule {}
