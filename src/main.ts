import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

// Origins allowed to call this API.
// Billo frontend: Vite dev server and the Electron app (app://-).
const DEFAULT_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'app://-',
];

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const origins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
    : DEFAULT_ORIGINS;
  app.enableCors({ origin: origins, credentials: true });

  app.enableShutdownHooks();
  

  // Port 3000 is used by the Next.js frontend, so the API uses 4000.
  await app.listen(process.env.PORT ?? 4000);
}
await bootstrap();
