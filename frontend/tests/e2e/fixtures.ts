import { readFileSync } from 'node:fs';
export const fixturePath = new URL('../.runtime.json', import.meta.url);
export type Account = { email: string; username: string; password: string; token: string };
export type Fixtures = {
  admin: Account;
  owner: Account;
  other: Account;
  skill: { id: number; name: string };
  goalId?: number;
};
export const fixtures = (): Fixtures => JSON.parse(readFileSync(fixturePath, 'utf8'));
