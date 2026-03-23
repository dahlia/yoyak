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
import { summarize } from "./summary.ts";

Deno.test("summarize streams chunk text from content blocks", async () => {
  let recordedMessages: unknown[] = [];
  const model = {
    invoke() {
      return Promise.reject(new Error("not used"));
    },
    stream(messages: unknown[]) {
      recordedMessages = messages;
      return Promise.resolve({
        async *[Symbol.asyncIterator]() {
          yield { contentBlocks: [{ type: "text", text: "first " }] };
          yield { content: "second" };
        },
      });
    },
  };

  const chunks: string[] = [];
  for await (
    const chunk of summarize(model, "# Heading\n\nBody", {
      targetLanguage: "ko",
      paragraphs: 2,
    })
  ) {
    chunks.push(chunk);
  }

  strictEqual(chunks.join(""), "first second");
  const [system, human] = recordedMessages as [{ content: string }, {
    content: string;
  }];
  ok(system.content.includes("Translate the input text into the Korean"));
  ok(system.content.includes("Produce 2 Markdown paragraphs"));
  strictEqual(human.content, "# Heading\n\nBody");
});
