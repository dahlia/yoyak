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
import { deepStrictEqual } from "node:assert/strict";
import { loadSettings, saveSettings } from "./settings.ts";

Deno.test("settings round-trip via XDG config home", async () => {
  const tempDir = await Deno.makeTempDir();
  const previous = Deno.env.get("XDG_CONFIG_HOME");

  try {
    Deno.env.set("XDG_CONFIG_HOME", tempDir);
    await saveSettings({ model: "gpt-4o", apiKey: "secret" });
    const settings = await loadSettings();
    deepStrictEqual(settings, { model: "gpt-4o", apiKey: "secret" });
  } finally {
    if (previous == null) Deno.env.delete("XDG_CONFIG_HOME");
    else Deno.env.set("XDG_CONFIG_HOME", previous);
    await Deno.remove(tempDir, { recursive: true });
  }
});
