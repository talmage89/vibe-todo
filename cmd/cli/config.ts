import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export interface AuthConfig {
  token: string;
  server: string;
}

const APP_NAME = "todo";
const AUTH_FILE = "auth.json";

export function getConfigDir(): string {
  const xdg = process.env.XDG_CONFIG_HOME;
  const base = xdg || join(homedir(), ".config");
  return join(base, APP_NAME);
}

export function loadAuth(): AuthConfig | null {
  const filePath = join(getConfigDir(), AUTH_FILE);
  if (!existsSync(filePath)) return null;

  const raw = readFileSync(filePath, "utf-8");
  const parsed: unknown = JSON.parse(raw);
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    typeof (parsed as AuthConfig).token !== "string" ||
    typeof (parsed as AuthConfig).server !== "string"
  ) {
    return null;
  }

  return parsed as AuthConfig;
}

export function saveAuth(config: AuthConfig): void {
  const dir = getConfigDir();
  mkdirSync(dir, { recursive: true, mode: 0o700 });

  const filePath = join(dir, AUTH_FILE);
  writeFileSync(filePath, `${JSON.stringify(config, null, 2)}\n`, {
    mode: 0o600,
  });
}

export function clearAuth(): void {
  const filePath = join(getConfigDir(), AUTH_FILE);
  if (existsSync(filePath)) {
    unlinkSync(filePath);
  }
}
