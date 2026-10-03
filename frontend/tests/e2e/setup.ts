import { request, type FullConfig } from '@playwright/test';
import { randomBytes } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { fixturePath, type Account } from './fixtures';
export default async function setup(config: FullConfig) {
  const api = await request.newContext({ baseURL: config.projects[0].use.baseURL });
  const run = randomBytes(5).toString('hex');
  async function account(name: string): Promise<Account> {
    const username = `e2e_${name}_${run}`;
    const email = `${username}@example.com`;
    const password = randomBytes(18).toString('base64url');
    const response = await api.post('/api/v1/auth/register', {
      data: { username, email, password },
    });
    if (response.status() !== 201)
      throw new Error(`Test registration failed: ${response.status()}`);
    const login = await api.post('/api/v1/auth/login', { data: { email, password } });
    if (!login.ok()) throw new Error('Test login failed');
    const token = (await login.json()).access_token;
    return { username, email, password, token };
  }
  const admin = await account('admin');
  const owner = await account('owner');
  const other = await account('other');
  execFileSync(
    'docker',
    [
      'compose',
      '--env-file',
      '.env.docker',
      'exec',
      '-T',
      'api',
      'python',
      '-m',
      'app.admin',
      admin.email,
    ],
    { cwd: fileURLToPath(new URL('../../../', import.meta.url)), stdio: 'pipe' },
  );
  const response = await api.post('/api/v1/skills', {
    headers: { Authorization: `Bearer ${admin.token}` },
    data: {
      name: `Frontend testing ${run}`,
      category: 'Engineering',
      description: 'Dedicated end-to-end test skill.',
    },
  });
  if (response.status() !== 201) throw new Error(`Catalog setup failed: ${response.status()}`);
  writeFileSync(
    fixturePath,
    JSON.stringify({ admin, owner, other, skill: await response.json() }),
    { mode: 0o600 },
  );
  await api.dispose();
}
