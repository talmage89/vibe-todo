export type DateFilter = "overdue" | "today";

export type ParsedSearchQuery = {
  text: string;
  status?: string;
  priority?: string;
  projectName?: string;
  dateFilter?: DateFilter;
};

const STATUS_MAP: Record<string, string> = {
  todo: "TODO",
  "in-progress": "IN_PROGRESS",
  in_progress: "IN_PROGRESS",
  inprogress: "IN_PROGRESS",
  done: "DONE",
};

const PRIORITY_MAP: Record<string, string> = {
  none: "NONE",
  low: "LOW",
  medium: "MEDIUM",
  high: "HIGH",
  urgent: "URGENT",
};

const DATE_FILTERS: Record<string, DateFilter> = {
  overdue: "overdue",
  today: "today",
};

const FILTER_PATTERN = /(?:^|\s)(is|priority|project):("(?:[^"\\]|\\.)*"|[^\s]+)/gi;

export function parseSearchQuery(input: string): ParsedSearchQuery {
  const result: ParsedSearchQuery = { text: "" };
  let remaining = input;

  const matches = [...input.matchAll(FILTER_PATTERN)];

  for (const match of matches) {
    if (!match[1] || !match[2]) continue;
    const key = match[1].toLowerCase();
    let value = match[2];

    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1).replace(/\\"/g, '"');
    }

    const valueLower = value.toLowerCase();

    if (key === "is") {
      if (DATE_FILTERS[valueLower]) {
        result.dateFilter = DATE_FILTERS[valueLower];
      } else if (STATUS_MAP[valueLower]) {
        result.status = STATUS_MAP[valueLower];
      }
    } else if (key === "priority") {
      if (PRIORITY_MAP[valueLower]) {
        result.priority = PRIORITY_MAP[valueLower];
      }
    } else if (key === "project") {
      result.projectName = value;
    }

    remaining = remaining.replace(match[0], " ");
  }

  result.text = remaining.replace(/\s+/g, " ").trim();
  return result;
}
