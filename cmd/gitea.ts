function printUsage(): void {
  console.error(
    [
      "Usage:",
      "  bun run gitea <METHOD> <PATH|URL> [--query k=v ...] [--header 'K: V' ...] [--data <json|@file>]",
      "",
      "Environment:",
      "  GITEA_BASE_URL   e.g. https://gitea.example.com (no trailing slash recommended)",
      "  GITEA_TOKEN      API token (sent as Authorization: token <token>)",
      "",
      "Examples:",
      "  bun run gitea GET /api/v1/user",
      "  bun run gitea GET /api/v1/repos/org/repo/pulls --query state=open",
      '  bun run gitea POST /api/v1/repos/org/repo/issues --data \'{"title":"hi"}\'',
      "  bun run gitea POST /api/v1/repos/org/repo/issues --data @payload.json",
    ].join("\n"),
  );
}

function isProbablyJson(text: string): boolean {
  const t = text.trim();
  return t.startsWith("{") || t.startsWith("[");
}

function joinUrl(base: string, path: string): string {
  const b = base.endsWith("/") ? base.slice(0, -1) : base;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

function tryPrettyJson(text: string): string {
  const trimmed = text.trim();
  if (!isProbablyJson(trimmed)) return text;
  try {
    return `${JSON.stringify(JSON.parse(trimmed), null, 2)}\n`;
  } catch {
    return text;
  }
}

type Header = { key: string; value: string };

const args = process.argv.slice(2);
const method = args[0]?.toUpperCase();
const rawPath = args[1];

if (!method || !rawPath || method.startsWith("-") || rawPath.startsWith("-")) {
  printUsage();
  process.exit(2);
}

const headers: Header[] = [];
const queryPairs: Array<[string, string]> = [];
let data: string | undefined;

for (let i = 2; i < args.length; i += 1) {
  const a = args[i];
  if (!a) continue;
  if (a === "--help" || a === "-h") {
    printUsage();
    process.exit(0);
  }
  if (a === "--header") {
    const hv = args[i + 1];
    if (!hv) {
      console.error("--header requires a value");
      process.exit(2);
    }
    const idx = hv.indexOf(":");
    if (idx === -1) {
      console.error(`Invalid header (expected 'K: V'): ${hv}`);
      process.exit(2);
    }
    const key = hv.slice(0, idx).trim();
    const value = hv.slice(idx + 1).trim();
    headers.push({ key, value });
    i += 1;
    continue;
  }
  if (a === "--query") {
    const q = args[i + 1];
    if (!q) {
      console.error("--query requires k=v");
      process.exit(2);
    }
    const eq = q.indexOf("=");
    if (eq === -1) {
      console.error(`Invalid query (expected k=v): ${q}`);
      process.exit(2);
    }
    queryPairs.push([q.slice(0, eq), q.slice(eq + 1)]);
    i += 1;
    continue;
  }
  if (a === "--data") {
    const d = args[i + 1];
    if (!d) {
      console.error("--data requires a value");
      process.exit(2);
    }
    data = d;
    i += 1;
    continue;
  }

  console.error(`Unknown option: ${a}`);
  printUsage();
  process.exit(2);
}

const baseUrl = process.env.GITEA_BASE_URL;
const token = process.env.GITEA_TOKEN;

const url =
  rawPath.startsWith("http://") || rawPath.startsWith("https://")
    ? rawPath
    : baseUrl
      ? joinUrl(baseUrl, rawPath)
      : (() => {
          console.error("Missing GITEA_BASE_URL and PATH is not a full URL.");
          printUsage();
          process.exit(2);
        })();

const u = new URL(url);
for (const [k, v] of queryPairs) u.searchParams.append(k, v);

const requestHeaders = new Headers();
for (const { key, value } of headers) requestHeaders.set(key, value);
if (token && !requestHeaders.has("Authorization")) {
  requestHeaders.set("Authorization", `token ${token}`);
}

let body: string | undefined;
if (data) {
  if (data.startsWith("@")) {
    body = await Bun.file(data.slice(1)).text();
  } else {
    body = data;
  }
  if (!requestHeaders.has("Content-Type") && isProbablyJson(body)) {
    requestHeaders.set("Content-Type", "application/json");
  }
}

const res = await fetch(u.toString(), {
  method,
  headers: requestHeaders,
  body,
});

const text = await res.text();

if (!res.ok) {
  console.error(`gitea: HTTP ${res.status} ${res.statusText}`);
  process.stdout.write(tryPrettyJson(text));
  process.exit(1);
}

process.stdout.write(tryPrettyJson(text));
