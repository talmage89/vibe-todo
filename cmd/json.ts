function printUsage(): void {
  // Intentionally terse: this is mainly for agent use.
  console.error(
    [
      "Usage:",
      "  bun run json [--compact] [--indent N] [--raw] [--pointer /a/0/b | --path a.b[0]] [file]",
      "",
      "Examples:",
      "  curl ... | bun run json",
      "  curl ... | bun run json --pointer /id --raw",
      "  bun run json response.json --path data.items[0].title --raw",
    ].join("\n"),
  );
}

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function decodePointerSegment(segment: string): string {
  // RFC6901 decoding
  return segment.replaceAll("~1", "/").replaceAll("~0", "~");
}

function getByPointer(root: unknown, pointer: string): unknown {
  if (pointer === "" || pointer === "/") return root;
  if (!pointer.startsWith("/")) {
    throw new Error(`Invalid JSON pointer: ${pointer}`);
  }

  const segments = pointer
    .split("/")
    .slice(1)
    .map(decodePointerSegment)
    .filter((s) => s.length > 0 || pointer.endsWith("/"));

  let current: unknown = root;
  for (const seg of segments) {
    if (Array.isArray(current)) {
      const idx = Number(seg);
      if (!Number.isInteger(idx) || idx < 0 || idx >= current.length) return undefined;
      current = current[idx];
      continue;
    }
    if (isRecord(current)) {
      current = current[seg];
      continue;
    }
    return undefined;
  }
  return current;
}

type PathToken = { type: "key"; key: string } | { type: "index"; index: number };

function parseDotPath(path: string): PathToken[] {
  // Supports: a.b[0].c and ["weird.key"][1]
  const tokens: PathToken[] = [];
  let i = 0;

  const readWhile = (pred: (ch: string) => boolean): string => {
    const start = i;
    while (i < path.length && pred(path[i] ?? "")) i += 1;
    return path.slice(start, i);
  };

  const skipWs = (): void => {
    readWhile((ch) => ch === " " || ch === "\t" || ch === "\n" || ch === "\r");
  };

  while (i < path.length) {
    skipWs();
    const ch = path[i];
    if (!ch) break;

    if (ch === ".") {
      i += 1;
      continue;
    }

    if (ch === "[") {
      i += 1;
      skipWs();
      const innerStart = path[i];
      if (innerStart === '"' || innerStart === "'") {
        const quote = innerStart;
        i += 1;
        let str = "";
        while (i < path.length) {
          const c = path[i];
          if (!c) break;
          if (c === "\\") {
            const next = path[i + 1];
            if (!next) break;
            str += next;
            i += 2;
            continue;
          }
          if (c === quote) {
            i += 1;
            break;
          }
          str += c;
          i += 1;
        }
        skipWs();
        if (path[i] !== "]") throw new Error(`Invalid path (missing ]) near: ${path.slice(i)}`);
        i += 1;
        tokens.push({ type: "key", key: str });
        continue;
      }

      const rawIndex = readWhile((c) => /[0-9]/.test(c));
      skipWs();
      if (path[i] !== "]") throw new Error(`Invalid path (missing ]) near: ${path.slice(i)}`);
      i += 1;
      const idx = Number(rawIndex);
      if (!Number.isInteger(idx)) throw new Error(`Invalid array index: ${rawIndex}`);
      tokens.push({ type: "index", index: idx });
      continue;
    }

    const key = readWhile((c) => /[A-Za-z0-9_$-]/.test(c));
    if (key.length === 0) {
      throw new Error(`Invalid path near: ${path.slice(i)}`);
    }
    tokens.push({ type: "key", key });
  }

  return tokens;
}

function getByDotPath(root: unknown, path: string): unknown {
  const tokens = parseDotPath(path);
  let current: unknown = root;
  for (const t of tokens) {
    if (t.type === "index") {
      if (!Array.isArray(current)) return undefined;
      current = current[t.index];
      continue;
    }
    if (!isRecord(current)) return undefined;
    current = current[t.key];
  }
  return current;
}

function tryParseJsonBestEffort(text: string): unknown {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    // Common case: someone captured headers + body; try to slice out the JSON part.
    const firstObj = trimmed.indexOf("{");
    const firstArr = trimmed.indexOf("[");
    const first =
      firstObj === -1 ? firstArr : firstArr === -1 ? firstObj : Math.min(firstObj, firstArr);
    if (first === -1) throw new Error("Input does not look like JSON.");

    const lastObj = trimmed.lastIndexOf("}");
    const lastArr = trimmed.lastIndexOf("]");
    const last = Math.max(lastObj, lastArr);
    if (last === -1 || last <= first) throw new Error("Input does not look like JSON.");

    const slice = trimmed.slice(first, last + 1);
    return JSON.parse(slice);
  }
}

function formatValue(value: unknown, indent: number, raw: boolean): string {
  if (
    raw &&
    (typeof value === "string" || typeof value === "number" || typeof value === "boolean")
  ) {
    return String(value);
  }
  if (raw && value === null) return "null";
  return JSON.stringify(value as JsonValue, null, indent);
}

const args = process.argv.slice(2);
let compact = false;
let indent = 2;
let raw = false;
let pointer: string | undefined;
let path: string | undefined;
let file: string | undefined;

for (let i = 0; i < args.length; i += 1) {
  const a = args[i];
  if (!a) continue;
  if (a === "--help" || a === "-h") {
    printUsage();
    process.exit(0);
  }
  if (a === "--compact" || a === "-c") {
    compact = true;
    continue;
  }
  if (a === "--raw" || a === "-r") {
    raw = true;
    continue;
  }
  if (a === "--indent") {
    const n = args[i + 1];
    if (!n) {
      console.error("--indent requires a number");
      process.exit(2);
    }
    indent = Number(n);
    i += 1;
    continue;
  }
  if (a === "--pointer") {
    const p = args[i + 1];
    if (!p) {
      console.error("--pointer requires a value");
      process.exit(2);
    }
    pointer = p;
    i += 1;
    continue;
  }
  if (a === "--path") {
    const p = args[i + 1];
    if (!p) {
      console.error("--path requires a value");
      process.exit(2);
    }
    path = p;
    i += 1;
    continue;
  }
  if (a.startsWith("-")) {
    console.error(`Unknown option: ${a}`);
    printUsage();
    process.exit(2);
  }
  file = a;
}

if (compact) indent = 0;

let inputText = "";
if (file) {
  inputText = await Bun.file(file).text();
} else if (process.stdin.isTTY) {
  console.error("No input. Provide a file or pipe JSON into stdin.");
  printUsage();
  process.exit(2);
} else {
  inputText = await Bun.stdin.text();
}

try {
  const root = tryParseJsonBestEffort(inputText);
  const selected =
    pointer !== undefined
      ? getByPointer(root, pointer)
      : path !== undefined
        ? getByDotPath(root, path)
        : root;

  const out = formatValue(selected, indent, raw);
  process.stdout.write(out);
  if (!out.endsWith("\n")) process.stdout.write("\n");
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`json: ${message}`);
  process.exit(1);
}
