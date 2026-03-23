// yoyak: An LLM-powered CLI tool for summarizing web pages
// Copyright (C) 2025 Hong Minhee <https://hongminhee.org/>
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.
import { ok, strictEqual } from "node:assert/strict";
import { dirname, fromFileUrl, join } from "@std/path";
import { canonicalModelMonikers } from "./models.ts";

const ROOT = dirname(dirname(fromFileUrl(import.meta.url)));
const CLI = join(ROOT, "src", "cli.ts");

async function runCli(args: string[], stdin?: string) {
  const command = new Deno.Command(Deno.execPath(), {
    args: [
      "run",
      "--allow-env",
      "--allow-sys",
      "--allow-read",
      CLI,
      ...args,
    ],
    stdin: stdin == null ? "null" : "piped",
    stdout: "piped",
    stderr: "piped",
    cwd: ROOT,
  });
  const child = command.spawn();
  if (stdin != null) {
    const writer = child.stdin.getWriter();
    await writer.write(new TextEncoder().encode(stdin));
    await writer.close();
  }
  const output = await child.output();
  return {
    code: output.code,
    stdout: new TextDecoder().decode(output.stdout),
    stderr: new TextDecoder().decode(output.stderr),
  };
}

Deno.test("cli help surfaces the main commands", async () => {
  const result = await runCli(["--help"]);
  strictEqual(result.code, 0);
  ok(result.stdout.includes("models"));
  ok(result.stdout.includes("summary"));
  ok(result.stdout.includes("scrape"));
  ok(result.stdout.includes("completions"));
});

Deno.test("cli subcommand help remains available", async () => {
  const models = await runCli(["models", "--help"]);
  const summary = await runCli(["summary", "--help"]);
  const scrape = await runCli(["scrape", "--help"]);
  strictEqual(models.code, 0);
  strictEqual(summary.code, 0);
  strictEqual(scrape.code, 0);
  ok(models.stdout.includes("List the supported model names"));
  ok(summary.stdout.includes("Summarize a text file or a web page"));
  ok(scrape.stdout.includes("Scrape a text file or a web page"));
});

Deno.test("cli models prints canonical model names only", async () => {
  const result = await runCli(["models"]);
  strictEqual(result.code, 0);
  strictEqual(result.stderr, "");
  strictEqual(result.stdout, `${canonicalModelMonikers.join("\n")}\n`);
  ok(!result.stdout.includes("chatgpt-4o-latest"));
});

Deno.test("cli models --json prints catalog metadata", async () => {
  const result = await runCli(["models", "--json"]);
  strictEqual(result.code, 0);
  const parsed = JSON.parse(result.stdout) as {
    models: Array<{
      name: string;
      providerModelName: string;
      deprecatedAliases: string[];
    }>;
  };
  strictEqual(parsed.models[0].name, canonicalModelMonikers[0]);
  strictEqual(
    parsed.models.find((model) => model.name === "gpt-5.3-chat-latest")
      ?.deprecatedAliases[0],
    "chatgpt-4o-latest",
  );
  strictEqual(
    parsed.models.find((model) => model.name === "gemini-2.5-flash")
      ?.deprecatedAliases.includes("gemini-2.0-flash"),
    true,
  );
});

Deno.test("cli emits bash completions", async () => {
  const result = await runCli(["completions", "bash"]);
  strictEqual(result.code, 0);
  ok(result.stdout.startsWith("#!/usr/bin/env bash"));
  ok(result.stdout.includes("_yoyak()"));
});

Deno.test("cli scrape reads from a local file", async () => {
  const tempDir = await Deno.makeTempDir();
  const path = join(tempDir, "sample.md");

  try {
    await Deno.writeTextFile(path, "# Sample\n\nText");
    const result = await runCli(["scrape", path]);
    strictEqual(result.code, 0);
    strictEqual(result.stdout, "# Sample\n\nText\n");
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("cli scrape reads from stdin", async () => {
  const result = await runCli(["scrape", "-"], "# From stdin");
  strictEqual(result.code, 0);
  strictEqual(result.stdout, "# From stdin\n");
});
