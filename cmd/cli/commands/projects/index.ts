export function run(args: string[]): void {
  if (args.includes("--help") || args.includes("-h")) {
    printHelp();
    process.exit(0);
  }

  console.error("projects: no subcommand specified. Use --help for usage.");
  process.exit(1);
}

function printHelp(): void {
  console.log(
    [
      "Usage: cli projects <subcommand>",
      "",
      "Manage projects.",
      "",
      "Subcommands:",
      "  list      List all projects",
      "  show      Show project details",
      "  create    Create a new project",
      "",
      "Options:",
      "  --help, -h    Show this help message",
    ].join("\n"),
  );
}
