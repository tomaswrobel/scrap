/**
 * This file is a part of Scrap, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomaswrobel/scrap.
 *
 * @license MIT
 * @fileoverview Builds the list of blocks documented on the /docs page.
 * @copyright Tomáš Wróbel 2025
 *
 * This module is DOM-free on purpose: it only processes the toolbox JSON
 * so it can run inside Astro's server-side frontmatter. The actual rendering
 * of each block into a mini workspace happens client-side in DocBlock.svelte.
 */
import spriteToolbox from "./data/sprite-toolbox.json";
import stageToolbox from "./data/stage-toolbox.json";
import type * as Blockly from "blockly";

export interface DocBlock {
	/** Stable, human-readable, unique-per-category identifier. */
	name: string;
	state: Blockly.serialization.blocks.State;
}

export interface DocCategory {
	name: string;
	blocks: DocBlock[];
}

function capitalize(value: string) {
	return value.charAt(0).toUpperCase() + value.slice(1);
}

const ARITHMETICS: Record<string, string> = {
	"+": "add",
	"-": "subtract",
	"*": "multiply",
	"/": "divide",
	"**": "power",
	"%": "modulo",
};

const COMPARISONS: Record<string, string> = {
	"==": "equals",
	"!=": "notEquals",
	"<": "lessThan",
	"<=": "lessThanOrEqual",
	">": "greaterThan",
	">=": "greaterThanOrEqual",
};

/**
 * Derives a stable, human-readable name for a toolbox block. Blocks such as
 * `set`, `change`, `arithmetics` or `compare` appear many times in a single
 * category with different shadows or fields, so they are disambiguated here.
 */
export function deriveName(item: any): string {
	const {type} = item;

	if (type === "set" || type === "change") {
		const shadow = item.inputs?.VAR?.shadow?.type;
		if (shadow) {
			return type + capitalize(shadow);
		}
	}
	if (type === "arithmetics") {
		return "arithmetics_" + (ARITHMETICS[item.fields?.OP ?? "+"] ?? "add");
	}
	if (type === "compare") {
		return "compare_" + (COMPARISONS[item.fields?.OP ?? "=="] ?? "equals");
	}
	if (type === "operation") {
		return item.fields?.OP === "||" ? "operation_or" : "operation_and";
	}
	if (type === "controls_if") {
		return item.extraState?.hasElse ? "controls_if_else" : "controls_if";
	}
	if ((type === "costume" || type === "backdrop") && item.fields?.VALUE === "index") {
		return type + "Index";
	}
	if (type === "dateProperty") {
		return "dateProperty_" + (item.inputs?.DATE?.shadow?.type ?? "date");
	}
	return type;
}

/**
 * Merges the sprite and stage toolboxes into the list of blocks shown on the
 * docs page. Blocks are taken exactly as they appear in the toolbox; the sprite
 * toolbox takes precedence over the stage one, and within a category the first
 * occurrence of a block wins over any later (duplicate) one.
 */
export function buildDocsCategories(): DocCategory[] {
	const order: DocCategory[] = [];
	const byName = new Map<string, {category: DocCategory; used: Set<string>}>();

	for (const toolbox of [spriteToolbox, stageToolbox]) {
		for (const category of toolbox) {
			if (category.kind !== "category" || !Array.isArray(category.contents)) {
				continue;
			}

			const categoryName = String(category.name);
			let entry = byName.get(categoryName);
			if (!entry) {
				const docCategory: DocCategory = {name: categoryName, blocks: []};
				entry = {category: docCategory, used: new Set()};
				byName.set(categoryName, entry);
				order.push(docCategory);
			}

			for (const item of category.contents) {
				if (item.kind !== "block" || !item.type) {
					continue;
				}
				const name = deriveName(item);
				if (entry.used.has(name)) {
					continue;
				}
				entry.used.add(name);
				const state: Blockly.serialization.blocks.State = {
					type: item.type,
				};
				if ("fields" in item) {
					state.fields = item.fields;
				}
				if ("inputs" in item) {
					state.inputs = item.inputs as Record<
						string,
						Blockly.serialization.blocks.ConnectionState
					>;
				}
				if ("extraState" in item) {
					state.extraState = item.extraState;
				}
				entry.category.blocks.push({name, state});
			}
		}
	}

	return order.filter(category => category.blocks.length > 0);
}
