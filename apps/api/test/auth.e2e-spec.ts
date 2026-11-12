import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import type { App } from 'supertest/types';

/**
 * The whole stack against a real (in-memory) MongoDB: validation, hashing, the cookie, the guard
 * and the rate limit. The throttler counts per route, so each route stays within its 5 a minute
 * until the last test, which checks the limit itself.
 */
describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let mongo: MongoMemoryServer;
  const agent = () => request(app.getHttpServer());
  const user = { email: 'Jane@Example.com', name: 'Jane Doe', password: 'Str0ng!pass' };

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    Object.assign(process.env, {
      NODE_ENV: 'test',
      MONGO_URI: mongo.getUri('auth-task-e2e'),
      JWT_SECRET: 'e2e-secret-that-is-at-least-32-characters-long',
      JWT_EXPIRES_IN: '1h',
      COOKIE_SECURE: 'false',
      LOG_LEVEL: 'silent',
    });
    // Imported only now: ConfigModule validates process.env when the module is first loaded.
    const { AppModule } = await import('../src/app.module');
    const { configureApp } = await import('../src/app.setup');
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
    await mongo?.stop();
  });

  const cookieOf = (res: request.Response): string => {
    const raw = res.headers['set-cookie'] as unknown as string[] | undefined;
    const cookie = raw?.find((c) => c.startsWith('access_token='));
    if (!cookie) throw new Error('no access_token cookie set');
    return cookie;
  };

  it('GET /api/health reports the database up', async () => {
    await agent().get('/api/health').expect(200, { status: 'ok', db: 'up' });
  });

  it('signs up, sets an httpOnly SameSite=Strict cookie and never returns the hash', async () => {
    const res = await agent().post('/api/auth/signup').send(user).expect(201);
    expect(res.body).toMatchObject({ email: 'jane@example.com', name: 'Jane Doe' });
    expect(res.body).not.toHaveProperty('passwordHash');
    expect(res.body).not.toHaveProperty('password');
    const cookie = cookieOf(res);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Strict/i);
  });

  it('refuses a second account with the same email (case-insensitive)', async () => {
    const res = await agent().post('/api/auth/signup').send({ ...user, email: 'JANE@example.com' }).expect(409);
    expect(res.body.message).toBe('An account with this email already exists');
  });

  it('rejects a weak password with every rule it breaks', async () => {
    const res = await agent().post('/api/auth/signup').send({ ...user, email: 'weak@example.com', password: '!!!' }).expect(400);
    expect(res.body.message).toEqual(
      expect.arrayContaining([
        'Password must be at least 8 characters long',
        'Password must contain at least one letter',
        'Password must contain at least one number',
      ]),
    );
    const noSpecial = await agent().post('/api/auth/signup').send({ ...user, email: 'weak@example.com', password: 'abc' }).expect(400);
    expect(noSpecial.body.message).toEqual(expect.arrayContaining(['Password must contain at least one special character']));
  });

  it('rejects a bad email, a short name and unknown fields', async () => {
    const res = await agent()
      .post('/api/auth/signup')
      .send({ email: 'not-an-email', name: 'Jo', password: 'Str0ng!pass', role: 'admin' })
      .expect(400);
    expect(res.body.message).toEqual(
      expect.arrayContaining([
        'Email must be a valid email address',
        'Name must be at least 3 characters long',
        'property role should not exist',
      ]),
    );
  });

  it('answers a wrong password and an unknown email identically', async () => {
    const wrong = await agent().post('/api/auth/signin').send({ email: user.email, password: 'Wr0ng!pass' }).expect(401);
    const unknown = await agent().post('/api/auth/signin').send({ email: 'nobody@example.com', password: 'Wr0ng!pass' }).expect(401);
    expect(wrong.body.message).toBe('Invalid email or password');
    expect(unknown.body.message).toBe(wrong.body.message);
  });

  it('signs in, reaches the protected endpoint with the cookie, and loses it after logout', async () => {
    await agent().get('/api/users/me').expect(401);

    const signIn = await agent().post('/api/auth/signin').send({ email: user.email, password: user.password }).expect(200);
    const cookie = cookieOf(signIn);

    const me = await agent().get('/api/users/me').set('Cookie', cookie).expect(200);
    expect(me.body).toMatchObject({ email: 'jane@example.com', name: 'Jane Doe' });
    expect(me.body).not.toHaveProperty('passwordHash');

    const out = await agent().post('/api/auth/logout').set('Cookie', cookie).expect(204);
    expect(cookieOf(out)).toMatch(/access_token=;/);
  });

  it('rejects a forged token', async () => {
    await agent().get('/api/users/me').set('Cookie', 'access_token=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ4In0.forged').expect(401);
  });

  it('rate-limits sign-in attempts', async () => {
    // 3 sign-ins so far; two more are allowed this minute, the next is refused.
    for (let i = 0; i < 2; i++) await agent().post('/api/auth/signin').send({ email: user.email, password: 'Wr0ng!pass' }).expect(401);
    await agent().post('/api/auth/signin').send({ email: user.email, password: user.password }).expect(429);
  });
});
