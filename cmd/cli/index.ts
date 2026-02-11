import { run as authRun } from "./commands/auth";
import { run as inboxRun } from "./commands/inbox";
import { run as projectsRun } from "./commands/projects";
import { run as tasksRun } from "./commands/tasks";
import { run as todayRun } from "./commands/today";
import { run as upcomingRun } from "./commands/upcoming";

const VERSION = "0.1.0";

const commands: Record<string, (args: string[]) => void> = {
  auth: authRun,
  projects: projectsRun,
  tasks: tasksRun,
  inbox: inboxRun,
  today: todayRun,
  upcoming: upcomingRun,
};

function printHelp(): void {
  console.log(
    [
      "Usage: cli <command> [options]",
      "",
      "Commands:",
      "  auth        Manage authentication",
      "  projects    Manage projects",
      "  tasks       Manage tasks",
      "  inbox       Show inbox tasks",
      "  today       Show tasks due today",
      "  upcoming    Show upcoming tasks",
      "",
      "Options:",
      "  --help, -h       Show this help message",
      "  --version, -v    Show version number",
    ].join("\n"),
  );
}

const args = process.argv.slice(2);
const first = args[0];

if (!first || first === "--help" || first === "-h") {
  printHelp();
  process.exit(0);
}

if (first === "--version" || first === "-v") {
  console.log(VERSION);
  process.exit(0);
}

const handler = commands[first];
if (!handler) {
  console.error(`Unknown command: ${first}`);
  console.error('Run "cli --help" for usage.');
  process.exit(1);
}

handler(args.slice(1));
