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
 * The list of canonical model names to advertise and persist.
 */
export const canonicalModelMonikers = [
  "claude-3-5-haiku-latest",
  "claude-3-5-sonnet-latest",
  "claude-3-7-sonnet-latest",
  "claude-opus-4-0",
  "claude-opus-4-1-20250805",
  "claude-sonnet-4-0",
  "deepseek-chat",
  "deepseek-reasoner",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.5-pro",
  "gemini-3-flash-preview",
  "gemini-3-pro-preview",
  "gemini-3.1-flash-lite-preview",
  "gemma3",
  "gpt-4.1",
  "gpt-4.1-mini",
  "gpt-4.1-nano",
  "gpt-4o",
  "gpt-4o-mini",
  "gpt-5",
  "gpt-5-mini",
  "gpt-5-nano",
  "gpt-5.1",
  "gpt-5.3-chat-latest",
  "gpt-5.4",
  "gpt-5.1-chat-latest",
  "o3",
  "o4-mini",
] as const;

/**
 * The canonical string representation of a model.
 */
export type CanonicalModelMoniker = typeof canonicalModelMonikers[number];

/**
 * Model names kept for backward compatibility.
 */
export const deprecatedModelMonikers = [
  "chatgpt-4o-latest",
  "claude-3-opus-latest",
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b",
  "gemini-1.5-pro",
  "gemini-2.0-flash-exp",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-2.0-flash-lite-preview-02-05",
  "gemini-2.0-flash-thinking-exp-01-21",
  "gemini-2.0-pro-exp-02-05",
  "gemini-2.5-flash-preview-04-17",
  "gemini-2.5-pro-preview-03-25",
  "gpt-4.5-preview",
  "o1",
  "o1-mini",
  "o1-preview",
  "o3-mini",
  "gpt-5-chat-latest",
] as const;

export type DeprecatedModelMoniker = typeof deprecatedModelMonikers[number];

export const deprecatedModelAliases: Readonly<
  Record<DeprecatedModelMoniker, CanonicalModelMoniker>
> = {
  "chatgpt-4o-latest": "gpt-5.3-chat-latest",
  "claude-3-opus-latest": "claude-opus-4-0",
  "gemini-1.5-flash": "gemini-2.5-flash",
  "gemini-1.5-flash-8b": "gemini-2.5-flash-lite",
  "gemini-1.5-pro": "gemini-2.5-pro",
  "gemini-2.0-flash-exp": "gemini-2.5-flash",
  "gemini-2.0-flash": "gemini-2.5-flash",
  "gemini-2.0-flash-lite": "gemini-2.5-flash-lite",
  "gemini-2.0-flash-lite-preview-02-05": "gemini-2.5-flash-lite",
  "gemini-2.0-flash-thinking-exp-01-21": "gemini-2.5-flash",
  "gemini-2.0-pro-exp-02-05": "gemini-2.5-pro",
  "gemini-2.5-flash-preview-04-17": "gemini-2.5-flash",
  "gemini-2.5-pro-preview-03-25": "gemini-2.5-pro",
  "gpt-4.5-preview": "gpt-4.1",
  "gpt-5-chat-latest": "gpt-5.3-chat-latest",
  "o1": "o3",
  "o1-mini": "o4-mini",
  "o1-preview": "o3",
  "o3-mini": "o4-mini",
} as const;

/**
 * The list of accepted model names.
 */
export const modelMonikers = [
  ...canonicalModelMonikers,
  ...deprecatedModelMonikers,
] as const;

/**
 * The accepted string representation of a model.
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

function asModelClass(modelClass: unknown): ModelClass {
  return modelClass as ModelClass;
}

/**
 * The per-model provider configuration.
 */
const modelConfigs = {
  "claude-3-5-haiku-latest": {
    modelClass: asModelClass(ChatAnthropic),
    providerModelName: "claude-3-5-haiku-latest",
  },
  "claude-3-5-sonnet-latest": {
    modelClass: asModelClass(ChatAnthropic),
    providerModelName: "claude-3-5-sonnet-latest",
  },
  "claude-3-7-sonnet-latest": {
    modelClass: asModelClass(ChatAnthropic),
    providerModelName: "claude-3-7-sonnet-latest",
  },
  "claude-opus-4-0": {
    modelClass: asModelClass(ChatAnthropic),
    providerModelName: "claude-opus-4-0",
  },
  "claude-opus-4-1-20250805": {
    modelClass: asModelClass(ChatAnthropic),
    providerModelName: "claude-opus-4-1-20250805",
  },
  "claude-sonnet-4-0": {
    modelClass: asModelClass(ChatAnthropic),
    providerModelName: "claude-sonnet-4-0",
  },
  "deepseek-chat": {
    modelClass: asModelClass(ChatDeepSeek),
    providerModelName: "deepseek-chat",
  },
  "deepseek-reasoner": {
    modelClass: asModelClass(ChatDeepSeek),
    providerModelName: "deepseek-reasoner",
  },
  "gemini-2.5-flash": {
    modelClass: asModelClass(ChatGoogleGenerativeAI),
    providerModelName: "gemini-2.5-flash",
  },
  "gemini-2.5-flash-lite": {
    modelClass: asModelClass(ChatGoogleGenerativeAI),
    providerModelName: "gemini-2.5-flash-lite",
  },
  "gemini-2.5-pro": {
    modelClass: asModelClass(ChatGoogleGenerativeAI),
    providerModelName: "gemini-2.5-pro",
  },
  "gemini-3-flash-preview": {
    modelClass: asModelClass(ChatGoogleGenerativeAI),
    providerModelName: "gemini-3-flash-preview",
  },
  "gemini-3-pro-preview": {
    modelClass: asModelClass(ChatGoogleGenerativeAI),
    providerModelName: "gemini-3-pro-preview",
  },
  "gemini-3.1-flash-lite-preview": {
    modelClass: asModelClass(ChatGoogleGenerativeAI),
    providerModelName: "gemini-3.1-flash-lite-preview",
  },
  "gemma3": {
    modelClass: asModelClass(ChatOllama),
    providerModelName: "gemma3",
  },
  "gpt-4.1": {
    modelClass: asModelClass(ChatOpenAI),
    providerModelName: "gpt-4.1",
  },
  "gpt-4.1-mini": {
    modelClass: asModelClass(ChatOpenAI),
    providerModelName: "gpt-4.1-mini",
  },
  "gpt-4.1-nano": {
    modelClass: asModelClass(ChatOpenAI),
    providerModelName: "gpt-4.1-nano",
  },
  "gpt-4o": {
    modelClass: asModelClass(ChatOpenAI),
    providerModelName: "gpt-4o",
  },
  "gpt-4o-mini": {
    modelClass: asModelClass(ChatOpenAI),
    providerModelName: "gpt-4o-mini",
  },
  "gpt-5": {
    modelClass: asModelClass(ChatOpenAI),
    providerModelName: "gpt-5",
  },
  "gpt-5-mini": {
    modelClass: asModelClass(ChatOpenAI),
    providerModelName: "gpt-5-mini",
  },
  "gpt-5-nano": {
    modelClass: asModelClass(ChatOpenAI),
    providerModelName: "gpt-5-nano",
  },
  "gpt-5.1": {
    modelClass: asModelClass(ChatOpenAI),
    providerModelName: "gpt-5.1",
  },
  "gpt-5.3-chat-latest": {
    modelClass: asModelClass(ChatOpenAI),
    providerModelName: "gpt-5.3-chat-latest",
  },
  "gpt-5.4": {
    modelClass: asModelClass(ChatOpenAI),
    providerModelName: "gpt-5.4",
  },
  "gpt-5.1-chat-latest": {
    modelClass: asModelClass(ChatOpenAI),
    providerModelName: "gpt-5.1-chat-latest",
  },
  "o3": {
    modelClass: asModelClass(ChatOpenAI),
    providerModelName: "o3",
  },
  "o4-mini": {
    modelClass: asModelClass(ChatOpenAI),
    providerModelName: "o4-mini",
  },
} as const satisfies Record<
  CanonicalModelMoniker,
  { modelClass: ModelClass; providerModelName: string }
>;

/**
 * Resolves deprecated aliases to their canonical model names.
 * @param model The model name to resolve.
 * @returns The canonical model name.
 */
export function resolveModelMoniker(
  model: ModelMoniker,
): CanonicalModelMoniker {
  return deprecatedModelAliases[model as keyof typeof deprecatedModelAliases] ??
    model;
}

/**
 * Gets the constructor for the given canonical model name.
 * @param model The canonical model name.
 * @returns The corresponding constructor.
 */
export function getModelClass(model: CanonicalModelMoniker): ModelClass {
  return modelConfigs[model].modelClass;
}

/**
 * Gets the provider-specific model name for the canonical model.
 * @param model The canonical model name.
 * @returns The provider-specific model name.
 */
export function getProviderModelName(model: CanonicalModelMoniker): string {
  return modelConfigs[model].providerModelName;
}

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
