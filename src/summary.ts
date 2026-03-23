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
  type BaseMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { getLogger } from "@logtape/logtape";
import { getMessageText } from "./model_text.ts";
import type { ModelLike } from "./models.ts";

const logger = getLogger(["yoyak", "summary"]);

function getPrompt(paragraphs: number, targetLanguage?: LanguageCode): string {
  return `You are a professional text summarization tool that processes Markdown-formatted text. Follow these guidelines to create summaries:

1. Input Format
- Expect Markdown-formatted text
- Process both inline formatting (bold, italic, links) and block elements (headings, lists, code blocks)
- Preserve the context of structured content
- Handle nested Markdown elements appropriately

2. Output Format
${
    targetLanguage == null
      ? ""
      : `- Translate the input text into the ${
        authoritativeLabels[targetLanguage].en
      } language`
  }
- ${
    paragraphs === 1
      ? "Produce a single Markdown paragraph"
      : `Produce ${paragraphs} Markdown paragraphs`
  }
- Do not include any headings or section markers
- Strip all formatting except essential emphasis (bold for key terms)
- Remove all links, keeping only the link text except essential URLs
- Exclude code blocks, images, and other non-text elements
- Do not include any meta text, separator lines, or decorative elements
- Output only the summary text, with no introduction or conclusion markers

3. Summarization Criteria
- Include the core arguments and important points from the original text
- Exclude supplementary explanations, examples, and repetitive content
- Summarize to approximately 20% of the original length
- Maintain the tone and perspective of the original text
- Preserve factual information as presented
- Keep the same tense as the original text
- Retain key technical terms as they appear in the source

4. Language Style
${
    targetLanguage == null
      ? ""
      : `- Translate the input text into the ${
        authoritativeLabels[targetLanguage].en
      } language`
  }
- Use concise and clear sentences
- Minimize formatting to enhance readability
- Clearly convey the cause-and-effect relationships from the original text
- Use appropriate conjunctions for natural sentence flow
- Maintain consistent paragraph formatting

5. Exclusions
- Do not add personal opinions
- Do not include inferred content not present in the original text
- Avoid meta-expressions like "the text states," "in summary," or "to conclude"
- Do not preserve original headings or section structure
- Exclude footnotes, citations, and reference markers
- Remove any front matter or metadata
- Omit author attributions or source information

Process the input Markdown text according to these guidelines and output only the ${
    paragraphs === 1
      ? "plain summary paragraph"
      : `${paragraphs} plain summary paragraphs`
  } in Markdown format.`;
}

/**
 * Options for {@link summarize} function.
 */
export interface SummarizeOptions {
  /**
   * An optional target language code in ISO 639-1.
   */
  targetLanguage?: LanguageCode;

  /**
   * The number of paragraphs to produce.
   * @default `1`
   */
  paragraphs?: number;

  /**
   * An optional signal to cancel the operation.
   */
  signal?: AbortSignal;
}

/**
 * Summarizes the given text.
 * @param model  The model to use for summarization.
 * @param text The text to summarize.
 * @param options The options for summarization.
 * @returns The summarized text.
 */
export async function* summarize(
  model: ModelLike,
  text: string,
  options: SummarizeOptions = {},
): AsyncIterable<string> {
  const messages: BaseMessage[] = [
    new SystemMessage(
      getPrompt(Math.max(1, options.paragraphs ?? 1), options.targetLanguage),
    ),
    new HumanMessage(text),
  ];
  logger.debug(
    "Invoking the model with the given messages: {messages}",
    { messages },
  );
  const result = await model.stream(messages, { signal: options.signal });
  logger.debug("Received the result: {result}", { result });
  for await (const chunk of result) yield getMessageText(chunk);
}
