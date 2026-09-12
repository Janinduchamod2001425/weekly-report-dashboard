import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';

import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  const port = configService.get<number>('PORT', 4000);
  const frontendUrl = configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:3000',
  );

  app.setGlobalPrefix('api/v1');

  app.use(cookieParser());

  app.enableCors({
    origin: frontendUrl,
    credentials: true,
  });

  app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
  );

  const swaggerConfig = new DocumentBuilder()
      .setTitle('Weekly Report Dashboard API')
      .setDescription(
          'REST API for weekly reports, manager reviews and team analytics',
      )
      .setVersion('1.0')
      .addCookieAuth('access_token')
      .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('docs', app, swaggerDocument);

  await app.listen(port);

  console.log(
      `Weekly Report Dashboard API running on http://localhost:${port}/api/v1`,
  );
  console.log(`Swagger documentation: http://localhost:${port}/docs`);
}

void bootstrap();