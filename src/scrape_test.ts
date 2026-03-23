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
import { ok } from "node:assert/strict";
import { scrape } from "./scrape.ts";

Deno.test("scrape converts fetched HTML into markdown", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () =>
    Promise.resolve(
      new Response(
        [
          "<html><head><title>Example</title></head><body>",
          "<main><h1>Example</h1><p>Paragraph.</p></main>",
          "</body></html>",
        ].join(""),
        { headers: { "Content-Type": "text/html; charset=utf-8" } },
      ),
    );

  try {
    const markdown = await scrape("https://example.com");
    ok(markdown?.includes("# Example"));
    ok(markdown?.includes("Paragraph."));
  } finally {
    globalThis.fetch = originalFetch;
  }
});
