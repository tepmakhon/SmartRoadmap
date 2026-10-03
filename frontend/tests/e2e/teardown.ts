import { request, type FullConfig } from '@playwright/test';
import { existsSync, unlinkSync } from 'node:fs';
import { fixturePath, fixtures } from './fixtures';
export default async function teardown(config: FullConfig) {
  if (!existsSync(fixturePath)) return;
  const data = fixtures();
  const api = await request.newContext({ baseURL: config.projects[0].use.baseURL });
  for (const account of [data.owner, data.other, data.admin]) {
    const login = await api.post('/api/v1/auth/login', {
      data: { email: account.email, password: account.password },
    });
    if (login.status() === 403) continue;
    if (!login.ok()) throw new Error(`Test cleanup login failed: ${login.status()}`);
    account.token = (await login.json()).access_token;
    const headers = { Authorization: `Bearer ${account.token}` };
    for (const domain of ['assessments', 'projects', 'roadmaps', 'goals', 'topics', 'skills']) {
      const response = await api.get(`/api/v1/users/me/${domain}?limit=100`, { headers });
      if (response.ok())
        for (const item of await response.json())
          await api.delete(
            `/api/v1/users/me/${domain}/${domain === 'skills' ? item.skill.id : item.id}`,
            { headers },
          );
    }
  }
  const removed = await api.delete(`/api/v1/skills/${data.skill.id}`, {
    headers: { Authorization: `Bearer ${data.admin.token}` },
  });
  if (!removed.ok()) throw new Error(`Test catalog cleanup failed: ${removed.status()}`);
  for (const account of [data.owner, data.other, data.admin])
    await api.delete('/api/v1/users/me', { headers: { Authorization: `Bearer ${account.token}` } });
  await api.dispose();
  unlinkSync(fixturePath);
}
