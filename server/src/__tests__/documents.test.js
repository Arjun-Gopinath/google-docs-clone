const request = require('supertest');
const path = require('path');
const fs = require('fs');
const { buildTestApp } = require('./helpers');

async function loginAs(app, email) {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password: 'password123' });
  return res.body.token;
}

describe('Document CRUD', () => {
  let app, aliceToken, bobToken, charlieToken;

  beforeAll(async () => {
    ({ app } = buildTestApp());
    [aliceToken, bobToken, charlieToken] = await Promise.all([
      loginAs(app, 'alice@example.com'),
      loginAs(app, 'bob@example.com'),
      loginAs(app, 'charlie@example.com'),
    ]);
  });

  it('creates a document', async () => {
    const res = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ title: 'My First Doc' });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('My First Doc');
    expect(res.body.id).toBeDefined();
  });

  it('lists owned documents', async () => {
    const res = await request(app)
      .get('/api/documents')
      .set('Authorization', `Bearer ${aliceToken}`);

    expect(res.status).toBe(200);
    expect(res.body.owned.length).toBeGreaterThan(0);
    expect(res.body.owned[0].title).toBe('My First Doc');
  });

  it('fetches a document the owner created', async () => {
    const create = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ title: 'Fetch Test' });

    const res = await request(app)
      .get(`/api/documents/${create.body.id}`)
      .set('Authorization', `Bearer ${aliceToken}`);

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Fetch Test');
    expect(res.body.role).toBe('owner');
  });

  it('updates document title and content', async () => {
    const create = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({});

    const res = await request(app)
      .put(`/api/documents/${create.body.id}`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ title: 'Renamed', content: '{"type":"doc","content":[]}' });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Renamed');
  });

  it('prevents unauthorized users from accessing a document', async () => {
    const create = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({});

    const res = await request(app)
      .get(`/api/documents/${create.body.id}`)
      .set('Authorization', `Bearer ${charlieToken}`);

    expect(res.status).toBe(404);
  });

  it('deletes a document (owner only)', async () => {
    const create = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({});

    const del = await request(app)
      .delete(`/api/documents/${create.body.id}`)
      .set('Authorization', `Bearer ${aliceToken}`);
    expect(del.status).toBe(204);

    const get = await request(app)
      .get(`/api/documents/${create.body.id}`)
      .set('Authorization', `Bearer ${aliceToken}`);
    expect(get.status).toBe(404);
  });
});

describe('Document Sharing', () => {
  let app, aliceToken, bobToken, charlieToken;
  let docId;

  beforeAll(async () => {
    ({ app } = buildTestApp());
    [aliceToken, bobToken, charlieToken] = await Promise.all([
      loginAs(app, 'alice@example.com'),
      loginAs(app, 'bob@example.com'),
      loginAs(app, 'charlie@example.com'),
    ]);

    const create = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ title: 'Shared Doc' });
    docId = create.body.id;
  });

  it('owner can share with another user', async () => {
    const res = await request(app)
      .post(`/api/documents/${docId}/share`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ email: 'bob@example.com' });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('bob@example.com');
  });

  it('shared user can access the document', async () => {
    const res = await request(app)
      .get(`/api/documents/${docId}`)
      .set('Authorization', `Bearer ${bobToken}`);

    expect(res.status).toBe(200);
    expect(res.body.role).toBe('shared');
  });

  it('non-shared user still cannot access the document', async () => {
    const res = await request(app)
      .get(`/api/documents/${docId}`)
      .set('Authorization', `Bearer ${charlieToken}`);
    expect(res.status).toBe(404);
  });

  it('shared doc appears in bob\'s shared list', async () => {
    const res = await request(app)
      .get('/api/documents')
      .set('Authorization', `Bearer ${bobToken}`);

    expect(res.status).toBe(200);
    const found = res.body.shared.find((d) => d.id === docId);
    expect(found).toBeDefined();
  });

  it('owner can revoke access', async () => {
    const sharesRes = await request(app)
      .get(`/api/documents/${docId}/shares`)
      .set('Authorization', `Bearer ${aliceToken}`);
    const bobShare = sharesRes.body.find((s) => s.email === 'bob@example.com');

    await request(app)
      .delete(`/api/documents/${docId}/shares/${bobShare.id}`)
      .set('Authorization', `Bearer ${aliceToken}`);

    const afterRevoke = await request(app)
      .get(`/api/documents/${docId}`)
      .set('Authorization', `Bearer ${bobToken}`);
    expect(afterRevoke.status).toBe(404);
  });
});

describe('File Upload', () => {
  let app, aliceToken;
  const tmpFile = path.join('/tmp', 'test-upload.txt');

  beforeAll(async () => {
    ({ app } = buildTestApp());
    aliceToken = await loginAs(app, 'alice@example.com');
    fs.writeFileSync(tmpFile, 'Hello from uploaded file\nLine two');
  });

  afterAll(() => fs.unlinkSync(tmpFile));

  it('uploads a .txt file and creates a document', async () => {
    const res = await request(app)
      .post('/api/documents/upload')
      .set('Authorization', `Bearer ${aliceToken}`)
      .attach('file', tmpFile);

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('test-upload');
    const content = JSON.parse(res.body.content);
    expect(content.type).toBe('doc');
    const text = content.content.map((n) => n.content?.[0]?.text || '').join('\n');
    expect(text).toContain('Hello from uploaded file');
  });

  it('rejects unsupported file types', async () => {
    const pdfFile = path.join('/tmp', 'test.pdf');
    fs.writeFileSync(pdfFile, '%PDF-fake');

    const res = await request(app)
      .post('/api/documents/upload')
      .set('Authorization', `Bearer ${aliceToken}`)
      .attach('file', pdfFile);

    expect(res.status).toBe(400);
    fs.unlinkSync(pdfFile);
  });
});
