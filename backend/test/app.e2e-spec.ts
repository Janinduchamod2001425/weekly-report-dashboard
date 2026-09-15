import {
  HttpStatus,
  type INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';

import { AppModule } from '../src/app.module.js';

describe('Authentication API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const testingModule: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = testingModule.createNestApplication();

    app.setGlobalPrefix('api/v1');
    app.use(cookieParser());

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

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/auth/me', () => {
    it('rejects a request without an authentication cookie', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .expect(HttpStatus.UNAUTHORIZED);

      expect(response.body).toEqual(
        expect.objectContaining({
          statusCode: HttpStatus.UNAUTHORIZED,
        }),
      );

      expect(response.body.message).toBeDefined();
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('rejects an empty login request', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({})
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toEqual(
        expect.objectContaining({
          statusCode: HttpStatus.BAD_REQUEST,
        }),
      );

      expect(response.body.message).toEqual(expect.any(Array));
    });

    it('rejects an invalid email format', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'not-an-email',
          password: 'Password123!',
        })
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toEqual(
        expect.objectContaining({
          statusCode: HttpStatus.BAD_REQUEST,
        }),
      );
    });

    it('rejects an incorrect password', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@weeklyreport.com',
          password: 'DefinitelyWrongPassword123!',
        })
        .expect(HttpStatus.UNAUTHORIZED);

      expect(response.body).toEqual(
        expect.objectContaining({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Invalid email or password',
        }),
      );
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('clears the authentication cookie', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .expect(HttpStatus.OK);

      expect(response.body).toEqual({
        message: 'Logout successful',
      });

      const cookies = response.headers['set-cookie'];

      expect(cookies).toBeDefined();
      expect(String(cookies)).toContain('access_token=');
    });
  });
});
