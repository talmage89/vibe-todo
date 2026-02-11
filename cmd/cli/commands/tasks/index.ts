export function run(args: string[]): void {
  if (args.includes("--help") || args.includes("-h")) {
    printHelp();
    process.exit(0);
  }

  console.error("tasks: no subcommand specified. Use --help for usage.");
  process.exit(1);
}

function printHelp(): void {
  console.log(
    [
      "Usage: cli tasks <subcommand>",
      "",
      "Manage tasks.",
      "",
      "Subcommands:",
      "  list      List tasks",
      "  show      Show task details",
      "  create    Create a new task",
      "  update    Update a task",
      "",
      "Options:",
      "  --help, -h    Show this help message",
    ].join("\n"),
  );
}
