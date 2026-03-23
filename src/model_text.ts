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

export interface TextContentBlock {
  type: string;
  text?: string;
}

export interface MessageLike {
  content?: unknown;
  contentBlocks?: unknown;
}

function stringifyContent(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    const chunks = value.map((item): string => {
      if (
        item != null &&
        typeof item === "object" &&
        "type" in item &&
        (item as TextContentBlock).type === "text" &&
        typeof (item as TextContentBlock).text === "string"
      ) {
        return (item as TextContentBlock).text ?? "";
      }
      return stringifyContent(item);
    }).filter((item) => item.length > 0);
    return chunks.join("");
  }
  if (
    value != null &&
    typeof value === "object" &&
    "type" in value &&
    (value as TextContentBlock).type === "text" &&
    typeof (value as TextContentBlock).text === "string"
  ) {
    return (value as TextContentBlock).text ?? "";
  }
  if (value == null) return "";
  return String(value);
}

export function getMessageText(message: MessageLike): string {
  if (Array.isArray(message.contentBlocks)) {
    const content = stringifyContent(message.contentBlocks);
    if (content.length > 0) return content;
  }
  return stringifyContent(message.content);
}
