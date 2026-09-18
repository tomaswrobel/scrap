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
 * @fileoverview @scrap/blockly entry point.
 */
import BlocksToCode from "@scrap/code-transformers/blocksToCode";
import type {CustomBlock} from "@scrap/utils/CustomBlock.ts";
import * as Blockly from "blockly/core";
import * as En from "blockly/msg/en";
import type {BlockDefinition, Category} from "./category.ts";
import miscBlocks from "./data/blocks.json";
import baseTheme from "./data/theme.json";
import {pathMapToFilenameMap} from "@scrap/utils/pathMapToFilenameMap.ts";
import {registerBlock} from "./registerBlock.ts";

import.meta.glob<void>("./fields/*.ts", {eager: true});
import.meta.glob<void>("./plugins/*.ts", {eager: true});

export const extensions = pathMapToFilenameMap(
	import.meta.glob<(this: Blockly.Block) => void>("./extensions/*.ts", {
		eager: true,
		import: "default",
	}),
);

export const blocks = pathMapToFilenameMap(
	import.meta.glob<CustomBlock<never>>("./blocks/*.ts", {
		eager: true,
		import: "default",
	}),
);

export const categories = pathMapToFilenameMap(
	import.meta.glob<Category>("./data/categories/*.json", {
		eager: true,
		import: "default",
	}),
);

const categoryEntries = Object.entries(categories);

const categorizedBlocks = categoryEntries.flatMap(([style, category]) =>
	Object.entries(category.blocks).map<BlockDefinition>(([type, block]) => ({
		...block,
		type,
		style,
	})),
);

const jsonBlocks = categorizedBlocks.concat(miscBlocks);

/**
 * Blocks that are ignored by the TypeScript generator.
 * These are blocks that are never part of the generated
 * code, as they are inside the mutator of another block,
 * or never appear in the workspace.
 */
const mutatorBlocks = Object.entries(blocks).reduce(
	(acc, [name, customBlock]) => {
		customBlock.register(name);
		return [...acc, ...(customBlock.mutatorBlocks ?? [])];
	},
	miscBlocks.map(block => block.type),
);

// Custom blocks (registered above) that declare a `category` get merged
// into that category's `blocks` here, so consumers that enumerate a
// category's block names (the Monaco theme/tokenizer, the docs pages) see
// them automatically instead of needing them listed by hand. This runs
// after `categorizedBlocks`/`jsonBlocks` are built, so it never reaches
// `Blockly.defineBlocksWithJsonArray` below, which would conflict with
// these blocks' own `Blockly.Blocks[name]` registration above.
for (const [name, customBlock] of Object.entries(blocks)) {
	if (customBlock.category) {
		categories[customBlock.category].blocks[name] = {type: name};
	}
}

for (const [name, extension] of Object.entries(extensions)) {
	Blockly.Extensions.register(name, extension);
}

const registerableBlocks = jsonBlocks.filter(
	data => !mutatorBlocks.includes(data.type) && !BlocksToCode.isRegistered(data.type),
);
registerableBlocks.forEach(registerBlock);

/**
 * All names of properties and methods that are available on the sprite and stage objects.
 */
export const entityPropertiesAndMethods = registerableBlocks.map(data => data.type);

Blockly.setLocale(En as unknown as Record<string, string>);
Blockly.FlyoutButton.TEXT_MARGIN_X = 20;
Blockly.FlyoutButton.TEXT_MARGIN_Y = 10;
Blockly.defineBlocksWithJsonArray(jsonBlocks);

export const theme = {
	...baseTheme,
	blockStyles: Object.fromEntries(
		categoryEntries.map(([style, category]) => [style, category.blockStyles]),
	),
	categoryStyles: Object.fromEntries(
		categoryEntries.map(([style, category]) => [
			style.toLowerCase(),
			{colour: category.blockStyles.colourPrimary},
		]),
	),
};

export {default as spriteToolbox} from "./data/sprite-toolbox.json";
export {default as stageToolbox} from "./data/stage-toolbox.json";
export {Blockly};
