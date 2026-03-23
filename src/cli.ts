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
import { Command, EnumType, ValidationError } from "@cliffy/command";
import { CompletionsCommand } from "@cliffy/command/completions";
import { Input } from "@cliffy/prompt";
import { isLanguageCode } from "@hongminhee/iso639-1";
import {
  ansiColorFormatter,
  configure,
  dispose,
  getLogger,
  getStreamSink,
} from "@logtape/logtape";
import { readAll } from "@std/io";
import { AsyncLocalStorage } from "node:async_hooks";
import metadata from "../deno.json" with { type: "json" };
import {
  getCanonicalModels,
  getModelCatalog,
  getModelClass,
  getProviderModelName,
  type ModelLike,
  type ModelMoniker,
  modelMonikers,
  resolveModelMoniker,
  testModel,
} from "./models.ts";
import { scrape } from "./scrape.ts";
import { loadSettings, saveSettings } from "./settings.ts";
import { summarize } from "./summary.ts";
import { translate } from "./translate.ts";

const consoleSink = getStreamSink(Deno.stderr.writable, {
  formatter: ansiColorFormatter,
});

await configure({
  contextLocalStorage: new AsyncLocalStorage(),
  sinks: { console: (record) => consoleSink(record) },
  loggers: [
    {
      category: ["logtape", "meta"],
      lowestLevel: "warning",
      sinks: ["console"],
    },
    { category: ["yoyak"], lowestLevel: "info", sinks: ["console"] },
  ],
});

const logger = getLogger(["yoyak", "cli"]);

async function exit(code?: number): Promise<never> {
  // FIXME: When LogTape provides a way to choose the appropriate level for the
  // log messages (`console.*`), we should use the console logger and get rid of
  // this custom exit function.
  await dispose();
  Deno.exit(code);
}

type GlobalOptions = {
  model?: ModelMoniker;
  apiKey?: string;
};

type GlobalTypes = {
  model: typeof modelMoniker;
};

async function getModel(
  options: { model?: ModelMoniker; apiKey?: string },
): Promise<ModelLike> {
  let { model, apiKey } = options;
  const settings = await loadSettings();
  model ??= settings?.model ?? undefined;
  apiKey ??= settings?.apiKey ?? undefined;
  if (model == null) {
    console.error(
      "-m/--model: The model must be specified for translation.",
    );
    return await exit(1);
  }
  if (apiKey == null) {
    console.error(
      "-a/--api-key: The API key must be specified for the model.",
    );
    return await exit(1);
  }
  const canonicalModel = resolveModelMoniker(model);
  const ModelClass = getModelClass(canonicalModel);
  return new ModelClass({
    model: getProviderModelName(canonicalModel),
    apiKey,
  });
}

async function scrapeContent(
  url: string,
  options: { userAgent?: string },
): Promise<string> {
  if (url === "-") {
    const bytes = await readAll(Deno.stdin);
    return new TextDecoder().decode(bytes);
  }
  if (URL.canParse(url)) {
    const result = await scrape(url, { userAgent: options.userAgent });
    if (result == null) {
      console.error("Failed to scrape the web page.");
      return await exit(1);
    }
    return result;
  }
  try {
    return await Deno.readTextFile(url);
  } catch (error) {
    logger.debug(
      "Failed to read the file {path}: {error}",
      { path: url, error },
    );
    console.error("Failed to read the file:", url);
    return await exit(1);
  }
}

const scrapeCommand = new Command<GlobalOptions, GlobalTypes>()
  .arguments("<url:string>")
  .description(
    "Scrape a text file or a web page and return the content in Markdown " +
      "format without summarization.  If you want to scrape a text from the " +
      "standard input, give `-` as the argument.",
  )
  .option(
    "-l, --language <language:string>",
    "The language code in ISO 639-1 to translate the content into.  " +
      "Do not translate if not specified.",
    (language) => {
      if (!isLanguageCode(language)) {
        throw new ValidationError(
          "-l/--language: Expected a valid language code.",
        );
      }
      return language;
    },
  )
  .option(
    "-u, --user-agent <userAgent:string>",
    "The User-Agent header to send in the HTTP request to the web page.",
  )
  .action(async (options, url: string) => {
    const result = await scrapeContent(url, { userAgent: options.userAgent });
    if (result == null) {
      console.error("Failed to scrape the web page.");
      return await exit(1);
    }
    if (options.language == null) {
      console.log(result);
    } else {
      const model = await getModel(options);
      const encoder = new TextEncoder();
      const abortController = new AbortController();
      Deno.addSignalListener(
        "SIGINT",
        abortController.abort.bind(abortController),
      );
      const signal = abortController.signal;
      try {
        for await (
          const chunk of translate(model, result, options.language, { signal })
        ) {
          await Deno.stdout.write(encoder.encode(chunk));
        }
      } catch (error) {
        logger.debug("Translation aborted: {error}", { error });
      }
      console.log();
    }
  });

const summaryCommand = new Command<GlobalOptions, GlobalTypes>()
  .arguments("<url:string>")
  .description(
    "Summarize a text file or a web page and return the content in Markdown " +
      "format.  If you want to summarize a text from the standard input, " +
      "give `-` as the argument.",
  )
  .option(
    "-l, --language <language:string>",
    "The language code in ISO 639-1 to translate the content into.  " +
      "Do not translate if not specified.",
    (language) => {
      if (!isLanguageCode(language)) {
        throw new ValidationError(
          "-l/--language: Expected a valid language code.",
        );
      }
      return language;
    },
  )
  .option(
    "-p, --paragraphs <paragraphs:number>",
    "The number of paragraphs to produce.",
    {
      default: 1,
      value(paragraphs) {
        if (paragraphs < 1 || !Number.isInteger(paragraphs)) {
          throw new ValidationError(
            "-p/--paragraphs: Expected a positive integer.",
          );
        }
        return paragraphs;
      },
    },
  )
  .option(
    "-u, --user-agent <userAgent:string>",
    "The User-Agent header to send in the HTTP request to the web page.",
  )
  .action(async (options, url: string) => {
    const result = await scrapeContent(url, options);
    const model = await getModel(options);
    const abortController = new AbortController();
    Deno.addSignalListener(
      "SIGINT",
      abortController.abort.bind(abortController),
    );
    const signal = abortController.signal;
    const encoder = new TextEncoder();
    try {
      for await (
        const chunk of summarize(model, result, {
          targetLanguage: options.language,
          paragraphs: options.paragraphs,
          signal,
        })
      ) {
        await Deno.stdout.write(encoder.encode(chunk));
      }
    } catch (error) {
      logger.debug("Translation aborted: {error}", { error });
    }
    console.log();
  });

const getModelCommand = new Command<GlobalOptions, GlobalTypes>()
  .description(
    "Get the configured default model and the corresponding API key.",
  )
  .action(async () => {
    const settings = await loadSettings();
    if (settings == null) {
      console.error("No model is configured.");
      return await exit(1);
    }
    console.log(`Model: ${settings.model}`);
    console.log(`API key: ${settings.apiKey}`);
  });

const modelsCommand = new Command()
  .description("List the supported model names.")
  .option(
    "--json",
    "Print the supported models in JSON format, including deprecated aliases.",
  )
  .action((options: { json?: boolean }) => {
    if (options.json) {
      console.log(JSON.stringify({ models: getModelCatalog() }, null, 2));
      return;
    }
    for (const model of getCanonicalModels()) {
      console.log(model.name);
    }
  });

const modelMoniker = new EnumType(modelMonikers);

const setModelCommand = new Command<GlobalOptions, GlobalTypes>()
  .arguments("<model:model>")
  .description("Set the default model and the corresponding API key.")
  .action(async (options, model) => {
    const apiKey = options.apiKey ?? await Input.prompt("API key:");
    const llm = await getModel({ model, apiKey });
    if (!await testModel(llm)) {
      console.error(
        "The model is not working; check the API key or your network connection.",
      );
      return await exit(1);
    }
    await saveSettings({ model: resolveModelMoniker(model), apiKey });
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
  .globalOption("-d, --debug", "Enable debug logging.", {
    async action(options) {
      if (!options.debug) return;
      await configure({
        contextLocalStorage: new AsyncLocalStorage(),
        sinks: { console: consoleSink },
        loggers: [
          {
            category: ["logtape", "meta"],
            lowestLevel: "warning",
            sinks: ["console"],
          },
          { category: ["yoyak"], lowestLevel: "debug", sinks: ["console"] },
        ],
        reset: true,
      });
    },
  })
  .command("summary", summaryCommand)
  .command("scrape", scrapeCommand)
  .command("models", modelsCommand)
  .command("get-model", getModelCommand)
  .command("set-model", setModelCommand)
  .command("completions", new CompletionsCommand());

if (import.meta.main) {
  const result = await command.parse(Deno.args);
  // @ts-ignore: result.cmd and the command can be the same
  if (result.cmd === command) {
    console.error("Please specify a subcommand.");
    await exit(1);
  }
}
