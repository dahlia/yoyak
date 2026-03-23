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
import { authoritativeLabels, type LanguageCode } from "@hongminhee/iso639-1";
import {
  AIMessage,
  type BaseMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { getLogger } from "@logtape/logtape";
import { detect } from "tinyld";
import { getMessageText } from "./model_text.ts";
import type { ModelLike } from "./models.ts";

const logger = getLogger(["yoyak", "translate"]);

function getSystemPrompt(language: LanguageCode, delimiter: string): string {
  const languageName = authoritativeLabels[language].en;
  return `You are a highly skilled translator with expertise in many languages. \
Your task is to identify the language of the text I provide and accurately translate \
it into the ${languageName} language while preserving the meaning, tone, \
and nuance of the original text. Please maintain proper grammar, spelling, \
and punctuation in the translated version. The input and output are both in Markdown. \
No other information is needed than the text itself.

After you finish your translation, append the following marker: "${delimiter}" \
(without quotes). This marker indicates that your translation is complete.`;
}

const CONTINUE_PROMPT = `Please continue translating right after the previous \
translation, without any duplicate sentences.`;

/**
 * Options for {@link translate} function.
 */
export interface TranslateOptions {
  /**
   * An optional signal to cancel the operation.
   */
  signal?: AbortSignal;
}

/**
 * Translates the given text into the target language.
 * @param model The model to use for translation.
 * @param text The text to translate.
 * @param targetLanguage The target language code in ISO 639-1.
 * @param options The options for translation.
 * @returns The translated text.
 */
export async function* translate(
  model: ModelLike,
  text: string,
  targetLanguage: LanguageCode,
  options: TranslateOptions = {},
): AsyncIterable<string> {
  if (detect(text) === targetLanguage) {
    yield text;
    return;
  }
  const delimiter = `</${Math.random().toString(36).substring(2, 10)}>`;
  const messages: BaseMessage[] = [
    new SystemMessage(getSystemPrompt(targetLanguage, delimiter)),
    new HumanMessage(text),
  ];
  let complete = false;
  do {
    logger.debug("Invoking the model with messages: {messages}", { messages });
    const result = await model.stream(messages, { signal: options.signal });
    logger.debug("Received the result: {result}", { result });
    let message = "";
    let buffer = "";
    for await (const chunk of result) {
      const str = getMessageText(chunk);
      buffer += str;
      message += str;
      if (buffer.match(/<\/[0-9a-z]{0,10}$/)) continue;
      complete = message.includes(delimiter);
      if (complete) {
        buffer = buffer.substring(0, buffer.indexOf(delimiter));
      }
      yield buffer;
      buffer = "";
      if (complete) break;
    }
    if (!complete) yield " ";
    messages.push(
      new AIMessage(message),
      new HumanMessage(CONTINUE_PROMPT),
    );
  } while (!complete);
}
