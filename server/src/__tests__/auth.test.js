const request = require('supertest');
const { buildTestApp } = require('./helpers');

describe('POST /api/auth/login', () => {
  let app;
  beforeAll(() => ({ app } = buildTestApp()));

  it('returns token and user on valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@example.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('alice@example.com');
    expect(res.body.user.name).toBe('Alice Chen');
    expect(res.body.user.password_hash).toBeUndefined();
  });

  it('returns 401 on wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@example.com', password: 'wrong' });
    expect(res.status).toBe(401);
  });

  it('returns 401 on unknown email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'password123' });
    expect(res.status).toBe(401);
  });

  it('returns 400 when fields are missing', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
  });
});

describe('GET /api/auth/me', () => {
  let app, token;

  beforeAll(async () => {
    ({ app } = buildTestApp());
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@example.com', password: 'password123' });
    token = res.body.token;
  });

  it('returns current user when authenticated', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe('alice@example.com');
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});
