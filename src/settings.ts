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
import { getLogger } from "@logtape/logtape";
import { dirname, join } from "@std/path";
import { parse, stringify } from "@std/toml";
import { homedir } from "node:os";
import {
  type CanonicalModelMoniker,
  isModelMoniker,
  resolveModelMoniker,
} from "./models.ts";

const logger = getLogger(["yoyak", "settings"]);

/**
 * The settings for the yoyak CLI tool.
 */
export interface Settings {
  /**
   * The large language model to use for summarization and translation.
   */
  readonly model: CanonicalModelMoniker;

  /**
   * The API key for the large language model.
   */
  readonly apiKey: string;
}

/**
 * Returns the path to the configuration file.
 * @returns The path to the configuration file.
 */
export function getSettingsPath(): string {
  if (Deno.build.os === "windows") {
    const appData = Deno.env.get("AppData") ?? Deno.env.get("LocalAppData") ??
      join(homedir(), "AppData", "Roaming");
    return join(appData, "yoyak", "yoyak.toml");
  }
  const xdgConfigHome = Deno.env.get("XDG_CONFIG_HOME") ??
    join(homedir(), ".config");
  return join(xdgConfigHome, "yoyak", "yoyak.toml");
}

/**
 * Saves the settings to the configuration file.
 * @param settings The settings to save.
 */
export async function saveSettings(settings: Settings): Promise<void> {
  const config = {
    llm: {
      model: settings.model,
      apiKey: settings.apiKey,
    },
  };
  const toml = stringify(config);
  const path = getSettingsPath();
  logger.debug("Saving settings to {path}...", { path });
  await Deno.mkdir(dirname(path), { recursive: true });
  await Deno.writeTextFile(path, toml);
}

/**
 * Loads the settings from the configuration file.
 * @returns The settings loaded from the configuration file, or `undefined`
 *          if the file does not exist or is invalid.
 */
export async function loadSettings(): Promise<Settings | undefined> {
  const path = getSettingsPath();
  logger.debug("Loading settings from {path}...", { path });
  let toml: string;
  try {
    toml = await Deno.readTextFile(path);
  } catch {
    return undefined;
  }
  const config = parse(toml);
  if (
    typeof config.llm !== "object" || config.llm == null ||
    !("model" in config.llm) || !("apiKey" in config.llm) ||
    !isModelMoniker(config.llm.model) || typeof config.llm.apiKey !== "string"
  ) {
    return undefined;
  }
  return {
    model: resolveModelMoniker(config.llm.model),
    apiKey: config.llm.apiKey,
  };
}
