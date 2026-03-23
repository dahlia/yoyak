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
import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage } from "@langchain/core/messages";
import { ChatDeepSeek } from "@langchain/deepseek";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOllama } from "@langchain/ollama";
import { ChatOpenAI } from "@langchain/openai";
import { getLogger } from "@logtape/logtape";
import { getMessageText, type MessageLike } from "./model_text.ts";

const logger = getLogger(["yoyak", "models"]);

/**
 * The list of available models.
 */
export const modelMonikers = [
  "chatgpt-4o-latest",
  "claude-3-5-haiku-latest",
  "claude-3-5-sonnet-latest",
  "claude-3-7-sonnet-latest",
  "claude-3-opus-latest",
  "deepseek-chat",
  "deepseek-reasoner",
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b",
  "gemini-1.5-pro",
  "gemini-2.0-flash",
  "gemini-2.0-flash-exp",
  "gemini-2.0-flash-lite",
  "gemini-2.0-flash-lite-preview-02-05",
  "gemini-2.0-flash-thinking-exp-01-21",
  "gemini-2.0-pro-exp-02-05",
  "gemini-2.5-flash-preview-04-17",
  "gemini-2.5-pro-preview-03-25",
  "gemma3",
  "gpt-4.1",
  "gpt-4.5-preview",
  "gpt-4o",
  "gpt-4o-mini",
  "o1",
  "o1-mini",
  "o1-preview",
  "o3",
  "o3-mini",
  "o4-mini",
] as const;

/**
 * The short string representation of a model.
 */
export type ModelMoniker = typeof modelMonikers[number];

/**
 * Tests if the given value is a model moniker.
 * @param value The value to test.
 * @returns Whether the value is a model moniker.
 */
export function isModelMoniker(value: unknown): value is ModelMoniker {
  return modelMonikers.includes(value as ModelMoniker);
}

/**
 * The model object.
 */
export type Model =
  | ChatOpenAI
  | ChatAnthropic
  | ChatDeepSeek
  | ChatGoogleGenerativeAI
  | ChatOllama;

export interface ModelStreamOptions {
  signal?: AbortSignal;
}

export interface ModelLike {
  invoke(...args: unknown[]): Promise<MessageLike>;
  stream(...args: unknown[]): Promise<AsyncIterable<MessageLike>>;
}

/**
 * The constructor of a model.
 */
export type ModelClass = new (
  ...args: unknown[]
) => ModelLike;

/**
 * The map of model monikers to model constructors.
 */
export const modelClasses: Record<ModelMoniker, unknown> = {
  "chatgpt-4o-latest": ChatOpenAI,
  "claude-3-5-haiku-latest": ChatAnthropic,
  "claude-3-5-sonnet-latest": ChatAnthropic,
  "claude-3-7-sonnet-latest": ChatAnthropic,
  "claude-3-opus-latest": ChatAnthropic,
  "deepseek-chat": ChatDeepSeek,
  "deepseek-reasoner": ChatDeepSeek,
  "gemini-1.5-flash": ChatGoogleGenerativeAI,
  "gemini-1.5-flash-8b": ChatGoogleGenerativeAI,
  "gemini-1.5-pro": ChatGoogleGenerativeAI,
  "gemini-2.0-flash": ChatGoogleGenerativeAI,
  "gemini-2.0-flash-exp": ChatGoogleGenerativeAI,
  "gemini-2.0-flash-lite": ChatGoogleGenerativeAI,
  "gemini-2.0-flash-lite-preview-02-05": ChatGoogleGenerativeAI,
  "gemini-2.0-flash-thinking-exp-01-21": ChatGoogleGenerativeAI,
  "gemini-2.0-pro-exp-02-05": ChatGoogleGenerativeAI,
  "gemini-2.5-flash-preview-04-17": ChatGoogleGenerativeAI,
  "gemini-2.5-pro-preview-03-25": ChatGoogleGenerativeAI,
  "gemma3": ChatOllama,
  "gpt-4.1": ChatOpenAI,
  "gpt-4.5-preview": ChatOpenAI,
  "gpt-4o": ChatOpenAI,
  "gpt-4o-mini": ChatOpenAI,
  "o1": ChatOpenAI,
  "o1-mini": ChatOpenAI,
  "o1-preview": ChatOpenAI,
  "o3": ChatOpenAI,
  "o3-mini": ChatOpenAI,
  "o4-mini": ChatOpenAI,
};

/**
 * Tests the given model if it is working.
 * @param model The model to test.
 * @returns Whether the model is working.
 */
export async function testModel(model: ModelLike): Promise<boolean> {
  const message = new HumanMessage("Please say “yes.”");
  logger.debug("Testing model with message: {message}", { message });
  try {
    const response = await model.invoke([message]);
    logger.debug("Model response: {response}", { response });
    return getMessageText(response).match(/\byes\b/i) != null;
  } catch (error) {
    logger.debug("Model failed to respond: {error}", { error });
    return false;
  }
}
