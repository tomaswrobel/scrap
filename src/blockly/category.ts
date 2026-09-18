/**
 * This file is a part of Scrap, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomas-wrobel/scrap.
 *
 * @license MIT
 * @copyright Tomáš Wróbel 2025
 * @fileoverview Strong type for block category JSON files (`./data/categories/*.json`).
 */

import type {Check} from "@scrap/types/Check";
import type {JSONValue} from "@scrap/utils/JsonValue";

export interface BlockArg {
	type: string;
	name: string;
	[x: string]: JSONValue;
}

type ArgsDefinitions = Partial<Record<`args${number}`, BlockArg[]>>;
type MessageDefinitions = Partial<Record<`message${number}`, string>>;

export interface BlockDefinition extends ArgsDefinitions, MessageDefinitions {
	type: string;
	inputsInline?: boolean;
	output?: Check;
	previousStatement?: Check;
	nextStatement?: Check;
	tooltip?: string;
	helpUrl?: string;
	enableContextMenu?: boolean;
	suppressPrefixSuffix?: boolean;
	align?: "LEFT" | "CENTRE" | "RIGHT";
	mutator?: string;
	extensions?: string[];
	extraState?: Record<string, unknown>;
}

export interface Category {
	/** A short, human-readable summary of what this category of blocks is for. Docs-only. */
	description: string;
	blockStyles: Record<`colour${"Primary" | "Secondary" | "Tertiary"}`, string>;
	blocks: Record<string, BlockDefinition>;
}
