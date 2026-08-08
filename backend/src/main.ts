import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { UPLOADS_ROOT, ensureUploadDirs } from './common/uploads.util';

async function bootstrap() {
  ensureUploadDirs();
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const logger = new Logger('Bootstrap');
  const isProduction = process.env.NODE_ENV === 'production';

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  // --- CORS: restricted to a known list of frontend origins ------------
  // Previously this was app.enableCors() with no options, which reflects
  // and allows ANY origin. That is fine on your own laptop but must never
  // ship like that — set CORS_ORIGINS in .env to your real frontend
  // domain(s) before deploying anywhere reachable by other people.
  const corsOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  // --- Uploaded files (profile photos) served as static files ----------
  app.useStaticAssets(UPLOADS_ROOT, { prefix: '/uploads' });

  // --- Swagger: only in non-production ----------------------------------
  // A public, unauthenticated /docs listing every endpoint of a platform
  // that will hold real students' data is not something to expose once
  // this is reachable from the internet.
  if (!isProduction) {
    const config = new DocumentBuilder()
      .setTitle('StudentHub API')
      .setDescription('Core API for the StudentHub academic platform (dev/staging only — disabled in production)')
      .setVersion('0.1')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  } else {
    logger.log('Swagger UI disabled (NODE_ENV=production)');
  }

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`StudentHub API listening on port ${port} (NODE_ENV=${process.env.NODE_ENV ?? 'development'})`);
  logger.log(`CORS allowed origins: ${corsOrigins.join(', ')}`);
}
bootstrap();
