import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'http';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { connectDB } from '../src/config/db.js';

let server;
let baseUrl;
let authToken = '';

describe('DocuShield End-to-End API Integration Suite', () => {
  before(async () => {
    await connectDB();
    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise(resolve => server.close(resolve));
    }
    await mongoose.disconnect();
  });

  const request = (method, path, body = null, token = null) => {
    return new Promise((resolve, reject) => {
      const url = new URL(path, baseUrl);
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const req = http.request(url, { method, headers }, (res) => {
        let raw = '';
        res.on('data', chunk => raw += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(raw) });
          } catch (e) {
            resolve({ status: res.statusCode, raw });
          }
        });
      });
      req.on('error', reject);
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  };

  test('1. Health Check Endpoint', async () => {
    const res = await request('GET', '/api/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
  });

  test('2. Authentication: Admin login with GxP credentials', async () => {
    const res = await request('POST', '/api/auth/login', {
      email: 'admin@docushield.com',
      password: 'DocuShield@2026'
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(res.data.data.token);
    assert.strictEqual(res.data.data.user.role, 'Admin');
    authToken = res.data.data.token;
  });

  test('3. Document Repository: Fetch seeded documents', async () => {
    const res = await request('GET', '/api/documents', null, authToken);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(Array.isArray(res.data.data));
    assert.ok(res.data.data.length > 0);
  });

  test('4. Dashboard Statistics: Fetch operational metrics', async () => {
    const res = await request('GET', '/api/dashboard/stats', null, authToken);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(res.data.data.totalDocuments >= 1);
  });

  test('5. Audit Trail: Verify immutable logging', async () => {
    const res = await request('GET', '/api/audit-logs', null, authToken);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(res.data.data.length > 0);
  });
});
