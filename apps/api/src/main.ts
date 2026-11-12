import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';
import { setupSwagger } from './swagger';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  configureApp(app);
  setupSwagger(app);

  const port = app.get(ConfigService).get<number>('PORT', 3000);
  await app.listen(port);
  app.get(Logger).log(`API listening on port ${port}`, 'Bootstrap');
}

void bootstrap();
