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
import { translate } from "./translate.ts";

Deno.test("translate continues until the delimiter appears", async () => {
  const calls: unknown[][] = [];
  const model = {
    invoke() {
      return Promise.reject(new Error("not used"));
    },
    stream(messages: unknown[]) {
      calls.push(messages);
      const systemPrompt = (messages[0] as { content: string }).content;
      const delimiter = systemPrompt.match(/"(<\/[0-9a-z]+>)"/)?.[1];
      if (delimiter == null) throw new Error("missing delimiter");
      if (calls.length === 1) {
        return Promise.resolve({
          async *[Symbol.asyncIterator]() {
            yield { contentBlocks: [{ type: "text", text: "annyeong" }] };
          },
        });
      }
      return Promise.resolve({
        async *[Symbol.asyncIterator]() {
          yield { content: ` haseyo${delimiter}` };
        },
      });
    },
  };

  const chunks: string[] = [];
  for await (const chunk of translate(model, "hello", "ko")) {
    chunks.push(chunk);
  }

  strictEqual(chunks.join(""), "annyeong  haseyo");
  strictEqual(calls.length, 2);
  const secondCall = calls[1] as [{ content: string }, { content: string }, {
    content: string;
  }, { content: string }];
  ok(secondCall[2].content.includes("annyeong"));
  strictEqual(
    secondCall[3].content,
    "Please continue translating right after the previous translation, without any duplicate sentences.",
  );
});
