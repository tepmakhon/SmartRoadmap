import { test, expect, type Page } from '@playwright/test';
import { randomBytes } from 'node:crypto';
import { fixtures, fixturePath } from './fixtures';
import { writeFileSync } from 'node:fs';
async function login(page: Page, account = fixtures().owner) {
  await page.goto('/login');
  await page.getByLabel('Email address').fill(account.email);
  await page.getByLabel(/^Password/).fill(account.password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).not.toHaveURL(/login/);
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: /A little closer/ })).toBeVisible();
}
async function save(page: Page, name: string) {
  await page.getByRole('dialog').getByRole('button', { name, exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
}
async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
}
test('registration, protected routing, persistence, and sign out', async ({ page }) => {
  const name = 'ui_' + randomBytes(5).toString('hex');
  const password = randomBytes(15).toString('base64url');
  let token: string | undefined;
  try {
    await page.goto('/goals');
    await expect(page).toHaveURL(/login/);
    await page.goto('/register');
    await page.getByLabel('Email address').fill(`${name}@example.com`);
    await page.getByLabel('Full name').fill('New Learner');
    await page.getByLabel('Username').fill(name);
    await page.getByLabel(/^Password/).fill(password);
    await page.getByLabel('Confirm password').fill(password);
    await page.getByRole('button', { name: 'Create account', exact: true }).click();
    await expect(page).toHaveURL(/dashboard/);
    token = await page.evaluate(
      () => JSON.parse(sessionStorage.getItem('smart-roadmap.session')!).access_token,
    );
    await page.reload();
    await expect(page.getByRole('heading', { name: 'A little closer, New.' })).toBeVisible();
    await page.getByRole('button', { name: 'Sign out', exact: true }).click();
    await expect(page).toHaveURL(/login/);
    expect(await page.evaluate(() => sessionStorage.getItem('smart-roadmap.session'))).toBeNull();
  } finally {
    if (token)
      await page.request.delete('/api/v1/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
  }
});
test('real learning journey: profile, skills, goal targets, resources, generation, progress, projects and assessments', async ({
  page,
}) => {
  const data = fixtures();
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await login(page);
  await page.goto('/profile');
  await page.getByLabel('Full name').fill('Roadmap Learner');
  await page.getByLabel('Location').fill('Phnom Penh');
  await page.getByRole('button', { name: 'Save profile', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Roadmap Learner' })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Location')).toHaveValue('Phnom Penh');
  await page.goto('/skills');
  await page.getByRole('button', { name: 'Add skill', exact: true }).click();
  await page
    .getByRole('dialog')
    .getByLabel(/^Skill/)
    .selectOption(String(data.skill.id));
  await save(page, 'Add skill');
  await expect(page.getByRole('heading', { name: data.skill.name, exact: true })).toBeVisible();
  await page.getByLabel('Your proficiency').selectOption('intermediate');
  await expect(page.getByLabel('Your proficiency')).toHaveValue('intermediate');
  await page.goto('/topics');
  await page.getByRole('button', { name: 'Create topic', exact: true }).click();
  await page.getByLabel('Topic name').fill('Foundations');
  await page.getByLabel('Related skill').selectOption(String(data.skill.id));
  await save(page, 'Save topic');
  await page.getByRole('link', { name: 'Explore resources' }).click();
  await page.getByRole('button', { name: 'Add resource', exact: true }).click();
  await page.getByLabel(/^Title/).fill('Practical reference');
  await page
    .getByLabel(/^Resource URL/)
    .fill('https://developer.mozilla.org/en-US/docs/Web/JavaScript');
  await save(page, 'Save resource');
  await expect(page.getByRole('link', { name: 'Open resource' })).toHaveAttribute(
    'rel',
    'noopener noreferrer',
  );
  await page.getByRole('button', { name: 'Edit Practical reference' }).click();
  await page.getByLabel(/^Title/).fill('Updated reference');
  await save(page, 'Save resource');
  await expect(page.getByRole('heading', { name: 'Updated reference' })).toBeVisible();
  await page.goto('/goals');
  await page.getByRole('button', { name: 'Create a goal', exact: true }).click();
  await page.getByLabel(/^Title/).fill('Become a backend engineer');
  await page.getByLabel('Target role').fill('Backend Engineer');
  await save(page, 'Create goal');
  await page.getByRole('link', { name: 'Explore goal' }).click();
  await page.getByRole('button', { name: 'Add target', exact: true }).click();
  await page
    .getByRole('dialog')
    .getByLabel(/^Skill/)
    .selectOption(String(data.skill.id));
  await page.getByLabel('Target proficiency').selectOption('expert');
  await save(page, 'Add skill target');
  await expect(page.getByText('Target: Expert · Position 0')).toBeVisible();
  await page.getByRole('button', { name: 'Generate roadmap', exact: true }).click();
  await expect(page).toHaveURL(/roadmaps\/\d+/);
  await expect(page.getByText('Your learning path', { exact: true })).toBeVisible();
  await expect(page.getByRole('progressbar').first()).toHaveAttribute('aria-valuenow', '0');
  const first = page.getByRole('button', { name: /^Complete task/ }).first();
  await first.click();
  await expect(page.getByRole('button', { name: /^Reopen task/ }).first()).toBeVisible();
  await expect(page.getByRole('progressbar').first()).not.toHaveAttribute('aria-valuenow', '0');
  await page.reload();
  await expect(page.getByRole('button', { name: /^Reopen task/ }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Add milestone', exact: true }).first().click();
  await page.getByLabel(/^Title/).fill('Practice stage');
  await save(page, 'Save milestone');
  const panel = page
    .locator('.milestone-panel')
    .filter({ has: page.getByRole('heading', { name: 'Practice stage' }) });
  await panel.getByRole('button', { name: 'Add task', exact: true }).click();
  await page.getByLabel(/^Title/).fill('Build a useful API');
  await save(page, 'Save task');
  await expect(page.getByText('Build a useful API', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Edit task Build a useful API' }).click();
  await page.getByLabel(/^Title/).fill('Build and test an API');
  await save(page, 'Save task');
  await page.getByRole('button', { name: 'Delete task Build and test an API' }).click();
  await save(page, 'Delete permanently');
  await expect(page.getByText('Build and test an API', { exact: true })).not.toBeVisible();
  await page.goto('/projects');
  await page.getByRole('button', { name: 'Create project', exact: true }).click();
  await page.getByLabel(/^Title/).fill('Portfolio API');
  await save(page, 'Save project');
  await page.getByRole('link', { name: 'Open project' }).click();
  await page.getByRole('button', { name: 'Associate skill' }).click();
  await page
    .getByRole('dialog')
    .getByLabel(/^Skill/)
    .selectOption(String(data.skill.id));
  await save(page, 'Associate skill');
  await expect(page.getByText(data.skill.name, { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Mark as completed' }).click();
  await expect(page.getByRole('button', { name: 'Reopen project' })).toBeVisible();
  await page.goto('/assessments');
  await page.getByRole('button', { name: 'Record assessment', exact: true }).click();
  await page
    .getByRole('dialog')
    .getByLabel(/^Skill/)
    .selectOption(String(data.skill.id));
  await page.getByLabel(/^Score/).fill('30');
  await page.getByLabel('Notes').fill('Still learning the fundamentals');
  await save(page, 'Record assessment');
  await expect(page.getByText('Still learning the fundamentals')).toBeVisible();
  await page.getByRole('button', { name: 'Delete assessment', exact: true }).click();
  await save(page, 'Delete permanently');
  await expect(page.getByText('Still learning the fundamentals')).not.toBeVisible();
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: 'A little closer, Roadmap.' })).toBeVisible();
  await page.getByRole('button', { name: 'Open notifications' }).click();
  await expect(
    page
      .getByRole('dialog')
      .getByText(/roadmap/i)
      .first(),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await noOverflow(page);
  expect(errors).toEqual([]);
});
test('expired access token refreshes against the real backend', async ({ page }) => {
  await login(page);
  let refreshes = 0;
  page.on('request', (r) => {
    if (r.url().endsWith('/auth/refresh')) refreshes++;
  });
  await page.evaluate(() => {
    const key = 'smart-roadmap.session';
    const tokens = JSON.parse(sessionStorage.getItem(key)!);
    tokens.access_token = 'expired-access-token';
    sessionStorage.setItem(key, JSON.stringify(tokens));
  });
  await page.reload();
  await expect(page.getByRole('heading', { name: /A little closer/ })).toBeVisible();
  expect(refreshes).toBe(1);
  expect(
    await page.evaluate(
      () => JSON.parse(sessionStorage.getItem('smart-roadmap.session')!).access_token,
    ),
  ).not.toBe('expired-access-token');
});
test('ownership denial, unknown routes, validation, and keyboard modal dismissal', async ({
  page,
}) => {
  await login(page, fixtures().other);
  const ownerGoal = await page.request.post('/api/v1/users/me/goals', {
    headers: { Authorization: `Bearer ${fixtures().owner.token}` },
    data: { title: 'Ownership check' },
  });
  expect(ownerGoal.status()).toBe(201);
  const id = (await ownerGoal.json()).id;
  await page.goto(`/goals/${id}`);
  await expect(page.getByRole('alert')).toContainText(/not found/i);
  await page.goto('/nothing-here');
  await expect(
    page.getByRole('heading', { name: 'This path doesn’t lead anywhere' }),
  ).toBeVisible();
  await page.goto('/goals');
  await page.getByRole('button', { name: 'Create a goal', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Create goal', exact: true }).click();
  await expect(page.getByText('Title is required.')).toBeVisible();
  await expect(page.getByLabel(/^Title/)).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Create a goal', exact: true })).toBeFocused();
});
test('mobile and tablet layouts stay within the viewport and navigation remains usable', async ({
  page,
}) => {
  for (const width of [375, 768]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Big ambitions/ })).toBeVisible();
    await noOverflow(page);
  }
  await page.setViewportSize({ width: 375, height: 900 });
  await login(page);
  for (const path of [
    '/dashboard',
    '/roadmaps',
    '/goals',
    '/skills',
    '/topics',
    '/resources',
    '/projects',
    '/assessments',
    '/recommendations',
    '/profile',
    '/settings',
  ]) {
    await page.goto(path);
    await expect(page.locator('main h1')).toBeVisible();
    await noOverflow(page);
  }
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await page.getByRole('dialog').getByRole('link', { name: 'Roadmaps', exact: true }).click();
  await expect(page).toHaveURL(/roadmaps$/);
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.locator('main h1')).toBeVisible();
  await expect(page.locator('.skeletons')).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: 'test-results/mobile-roadmaps.png', fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: /A little closer/ })).toBeVisible();
  await expect(page.locator('.skeletons')).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: 'test-results/desktop-dashboard.png', fullPage: true });
});

test('administrator catalog management uses real permissions and CRUD endpoints', async ({
  page,
}) => {
  await login(page, fixtures().admin);
  await page.goto('/skills');
  await page.getByRole('button', { name: 'Manage skill catalog' }).click();
  await page.getByRole('button', { name: 'Create catalog skill' }).click();
  const name = 'Catalog ' + randomBytes(4).toString('hex');
  await page.getByLabel('Skill name').fill(name);
  await page.getByLabel('Category').fill('QA');
  await save(page, 'Save changes');
  await page.getByRole('button', { name: `Edit catalog skill ${name}` }).click();
  await page.getByLabel('Skill name').fill(name + ' updated');
  await save(page, 'Save changes');
  await page.getByRole('button', { name: `Delete catalog skill ${name} updated` }).click();
  await save(page, 'Delete permanently');
  await expect(page.getByText(name + ' updated', { exact: true })).not.toBeVisible();
});

test('manual roadmap creation, editing, milestone deletion and roadmap deletion', async ({
  page,
}) => {
  await login(page);
  await page.goto('/roadmaps');
  await page.getByRole('button', { name: 'Create manually' }).click();
  await page.getByLabel(/^Title/).fill('Manual learning path');
  await save(page, 'Save roadmap');
  await page.getByRole('button', { name: 'Edit Manual learning path' }).click();
  await page.getByLabel(/^Title/).fill('Updated manual path');
  await save(page, 'Save roadmap');
  await page.getByRole('heading', { name: 'Updated manual path' }).click();
  await page.getByRole('button', { name: 'Add milestone', exact: true }).first().click();
  await page.getByLabel(/^Title/).fill('Temporary milestone');
  await save(page, 'Save milestone');
  await page.getByRole('button', { name: 'Edit milestone', exact: true }).click();
  await page.getByLabel(/^Title/).fill('Updated milestone');
  await save(page, 'Save milestone');
  await page.getByRole('button', { name: 'Delete Updated milestone' }).click();
  await save(page, 'Delete permanently');
  await expect(page.getByRole('heading', { name: 'Updated milestone' })).not.toBeVisible();
  await page.goto('/roadmaps');
  await page.getByRole('button', { name: 'Delete Updated manual path' }).click();
  await save(page, 'Delete permanently');
  await expect(page.getByRole('heading', { name: 'Updated manual path' })).not.toBeVisible();
});

test('account changes, sessions, reauthentication and deactivation', async ({ page }) => {
  const account = { ...fixtures().other };
  async function resume() {
    const pending = fixtures();
    pending.other = account;
    writeFileSync(fixturePath, JSON.stringify(pending), { mode: 0o600 });
    await login(page, account);
    account.token = await page.evaluate(
      () => JSON.parse(sessionStorage.getItem('smart-roadmap.session')!).access_token,
    );
    const data = fixtures();
    data.other = account;
    writeFileSync(fixturePath, JSON.stringify(data), { mode: 0o600 });
  }
  await resume();
  await page.goto('/settings');
  const username = page.locator('form').filter({ has: page.getByLabel('New username') });
  account.username += 'x';
  await username.getByLabel('New username').fill(account.username);
  await username.getByLabel('Current password').fill(account.password);
  await username.getByRole('button', { name: 'Update username' }).click();
  await expect(page).toHaveURL(/login/);
  await resume();
  await page.goto('/settings');
  const email = page.locator('form').filter({ has: page.getByLabel('New email address') });
  account.email = account.username + '@example.com';
  await email.getByLabel('New email address').fill(account.email);
  await email.getByLabel('Current password').fill(account.password);
  await email.getByRole('button', { name: 'Update email' }).click();
  await expect(page).toHaveURL(/login/);
  await resume();
  await page.goto('/settings');
  const password = page.locator('form').filter({ has: page.getByLabel(/^New password/) });
  await password.getByLabel('Current password').fill(account.password);
  account.password = randomBytes(18).toString('base64url');
  await password.getByLabel(/^New password/).fill(account.password);
  await password.getByRole('button', { name: 'Change password' }).click();
  await expect(page).toHaveURL(/login/);
  await resume();
  await page.goto('/settings');
  await page.getByRole('button', { name: 'Revoke all sessions', exact: true }).click();
  await save(page, 'Revoke all sessions');
  await expect(page).toHaveURL(/login/);
  await resume();
  await page.goto('/settings');
  await page.getByRole('button', { name: 'Deactivate account', exact: true }).click();
  await save(page, 'Deactivate account');
  await expect(page).toHaveURL(/login/);
  await page.getByLabel('Email address').fill(account.email);
  await page.getByLabel(/^Password/).fill(account.password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('alert')).toBeVisible();
});

test('landing, dashboard, forms and mobile navigation meet automated WCAG checks', async ({
  page,
}) => {
  const { default: AxeBuilder } = await import('@axe-core/playwright');
  async function check() {
    await page.evaluate(() => document.fonts.ready);
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(
      result.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })),
      })),
    ).toEqual([]);
  }
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Big ambitions/ })).toBeVisible();
  await check();
  await login(page);
  await expect(page.locator('.skeletons')).toHaveCount(0);
  await check();
  await page.goto('/goals');
  await page.getByRole('button', { name: 'Create goal', exact: true }).click();
  await check();
  await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 375, height: 900 });
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await check();
});

test('goal filtering and pagination use backend offsets and persist edits and deletion', async ({
  page,
}) => {
  const headers = { Authorization: `Bearer ${fixtures().owner.token}` };
  for (let index = 0; index < 13; index++) {
    const response = await page.request.post('/api/v1/users/me/goals', {
      headers,
      data: { title: `Pagination goal ${index}`, priority: 'high', status: 'active' },
    });
    expect(response.status()).toBe(201);
  }
  await login(page);
  await page.goto('/goals');
  await page.getByRole('combobox', { name: 'Priority', exact: true }).selectOption('high');
  await expect(page.getByText('Page 1 · 12 items')).toBeVisible();
  const offset = page.waitForRequest(
    (r) =>
      new URL(r.url()).pathname === '/api/v1/users/me/goals' &&
      new URL(r.url()).searchParams.get('offset') === '12',
  );
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await offset;
  await expect(page.getByText('Page 2 · 1 item', { exact: true })).toBeVisible();
  const title = await page.locator('.entity-card h2').innerText();
  await page.getByRole('button', { name: `Edit ${title}`, exact: true }).click();
  await page.getByLabel(/^Title/).fill('Edited pagination goal');
  await save(page, 'Save goal');
  await expect(page.getByRole('heading', { name: 'Edited pagination goal' })).toBeVisible();
  await page.getByRole('button', { name: 'Delete Edited pagination goal', exact: true }).click();
  await save(page, 'Delete permanently');
  await expect(page.getByRole('heading', { name: 'Edited pagination goal' })).not.toBeVisible();
  await page.getByRole('combobox', { name: 'Status', exact: true }).selectOption('paused');
  await expect(page.getByRole('heading', { name: 'No goals match these filters' })).toBeVisible();
});
