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
import { Command, EnumType } from "@cliffy/command";
import { Input } from "@cliffy/prompt";
import { isLanguageCode, validateLanguageCode } from "@hongminhee/iso639-1";
import metadata from "../deno.json" with { type: "json" };
import {
  type Model,
  modelClasses,
  type ModelMoniker,
  modelMonikers,
  testModel,
} from "./models.ts";
import { scrape } from "./scrape.ts";
import { translate } from "./translate.ts";

function getModel(
  options: { model?: ModelMoniker; apiKey?: string },
): Model {
  let { model, apiKey } = options;
  model ??= (localStorage.getItem("model") as ModelMoniker | undefined) ??
    undefined;
  apiKey ??= localStorage.getItem("apiKey") ?? undefined;
  if (model == null) {
    console.error(
      "-m/--model: The model must be specified for translation.",
    );
    Deno.exit(1);
  } else if (apiKey == null) {
    console.error(
      "-a/--api-key: The API key must be specified for the model.",
    );
    Deno.exit(1);
  }
  return new modelClasses[model]({ model, apiKey });
}

const scrapeCommand = new Command()
  .arguments("<url:string>")
  .description("Scrape a web page and return the content in Markdown format.")
  .option(
    "-l, --language <language:string>",
    "The language code in ISO 639-1 to translate the content into.  " +
      "Do not translate if not specified.",
  )
  .action(
    async (
      options: { model?: ModelMoniker; apiKey?: string; language: string },
      url: string,
    ) => {
      let result = await scrape(url);
      if (options.language != null) {
        if (!isLanguageCode(options.language)) {
          console.error("-l/--language: Invalid language code.");
          Deno.exit(1);
        }
      }
      if (result == null) {
        console.error("Failed to scrape the web page.");
        Deno.exit(1);
      }
      if (options.language) {
        validateLanguageCode(options.language);
        const model = getModel(options);
        result = await translate(model, result, options.language);
      }
      console.log(result);
    },
  );

const getModelCommand = new Command()
  .description(
    "Get the configured default model and the corresponding API key.",
  )
  .action(() => {
    const model = localStorage.getItem("model");
    const apiKey = localStorage.getItem("apiKey");
    if (model == null || apiKey == null) {
      console.error("No model is configured.");
      Deno.exit(1);
    }
    console.log(`Model: ${model}`);
    console.log(`API key: ${apiKey}`);
  });

const modelMoniker = new EnumType(modelMonikers);

const setModelCommand = new Command()
  .arguments("<model:model>")
  .description("Set the default model and the corresponding API key.")
  .action(async (options: { apiKey?: string }, model: ModelMoniker) => {
    const apiKey = options.apiKey ?? await Input.prompt("API key:");
    const llm = getModel({ model, apiKey });
    if (!await testModel(llm)) {
      console.error(
        "The model is not working; check the API key or your network connection.",
      );
      Deno.exit(1);
    }
    localStorage.setItem("model", model);
    localStorage.setItem("apiKey", apiKey);
  });

const command = new Command()
  .globalType("model", modelMoniker)
  .name("yoyak")
  .version(metadata.version)
  .meta("License", "GPL-3.0")
  .description("An LLM-powered CLI tool for summarizing web pages.")
  .help({ hints: true })
  .globalOption("-m, --model <model:model>", "The model to use.", {
    depends: ["api-key"],
  })
  .globalOption("-a, --api-key <apiKey:string>", "The API key for the model.")
  .command("scrape", scrapeCommand)
  .command("get-model", getModelCommand)
  .command("set-model", setModelCommand);

if (import.meta.main) {
  await command.parse(Deno.args);
}
