export function run(args: string[]): void {
  if (args.includes("--help") || args.includes("-h")) {
    printHelp();
    process.exit(0);
  }

  console.error("inbox: not yet implemented.");
  process.exit(1);
}

function printHelp(): void {
  console.log(
    [
      "Usage: cli inbox [options]",
      "",
      "Show tasks in your inbox.",
      "",
      "Options:",
      "  --help, -h    Show this help message",
    ].join("\n"),
  );
}
