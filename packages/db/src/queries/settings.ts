// packages/db/src/queries/settings.ts

type RunFn = (sql: string, params?: unknown[]) => void;
type GetFn = <T>(sql: string, params?: unknown[]) => T | null;

export function getSetting(get: GetFn, key: string): string | null {
  const row = get<{ value: string }>('SELECT value FROM user_setting WHERE key = ?', [key]);
  return row?.value ?? null;
}

export function setSetting(run: RunFn, key: string, value: string): void {
  run('INSERT OR REPLACE INTO user_setting (key, value) VALUES (?, ?)', [key, value]);
}
