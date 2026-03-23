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
import { strictEqual } from "node:assert/strict";
import { testModel } from "./models.ts";

Deno.test("testModel accepts text from standardized content blocks", async () => {
  const working = await testModel({
    invoke() {
      return Promise.resolve({
        contentBlocks: [{ type: "text", text: "yes" }],
      });
    },
    stream() {
      return Promise.resolve({ async *[Symbol.asyncIterator]() {} });
    },
  });

  strictEqual(working, true);
});
