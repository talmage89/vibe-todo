export function run(args: string[]): void {
  if (args.includes("--help") || args.includes("-h")) {
    printHelp();
    process.exit(0);
  }

  console.error("upcoming: not yet implemented.");
  process.exit(1);
}

function printHelp(): void {
  console.log(
    [
      "Usage: cli upcoming [options]",
      "",
      "Show upcoming tasks.",
      "",
      "Options:",
      "  --help, -h    Show this help message",
    ].join("\n"),
  );
}
