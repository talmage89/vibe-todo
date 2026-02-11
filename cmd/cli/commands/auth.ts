export function run(args: string[]): void {
  if (args.includes("--help") || args.includes("-h")) {
    printHelp();
    process.exit(0);
  }

  console.error("auth: no subcommand specified. Use --help for usage.");
  process.exit(1);
}

function printHelp(): void {
  console.log(
    [
      "Usage: cli auth <subcommand>",
      "",
      "Manage authentication credentials.",
      "",
      "Subcommands:",
      "  login     Log in to your account",
      "  logout    Log out of your account",
      "  status    Show current authentication status",
      "",
      "Options:",
      "  --help, -h    Show this help message",
    ].join("\n"),
  );
}
