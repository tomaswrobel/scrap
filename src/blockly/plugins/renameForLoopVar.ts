/**
 * This file is a part of Scrap, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomaswrobel/scrap.
 *
 * @license MIT
 * @fileoverview Blockly's extension for `for` block
 * @copyright Tomáš Wróbel 2025
 *
 * This extension adds a context menu item to rename the variable
 * in the `for` block.
 */
import {app} from "@scrap/types/App.svelte";
import {assert} from "@juvofy/lib/utils/assert";
import {reservedWordsInJs} from "@scrap/utils/reservedWordsInJs";
import * as Blockly from "blockly/core";

export async function renameForLoopVar(block: Blockly.BlockSvg) {
	const [value, type = "any"] = (block.getFieldValue("VAR") as string).split(":");
	const name = await app.dialog.fire({
		type: "text",
		title: "Rename Variable",
		body: "New name:",
		value,
		inputOptions: {
			pattern: /^[a-zA-Z_$][\w$]*$/,
		},
	});

	if (name === false) {
		return;
	}

	if (reservedWordsInJs.includes(name)) {
		return void app.dialog.fire({
			body: "This name is reserved by JavaScript.",
			title: "Invalid Name",
		});
	}

	block.setFieldValue(`${name}:${type}`, "VAR");
}

Blockly.ContextMenuRegistry.registry.register({
	id: renameForLoopVar.name,
	weight: 0,
	displayText: "Rename variable…",
	scopeType: Blockly.ContextMenuRegistry.ScopeType.BLOCK,
	callback(scope) {
		assert(scope.block);
		void renameForLoopVar(scope.block);
	},
	preconditionFn: scope => {
		if (scope.block?.type === "for" || scope.block?.type === "foreach") {
			return "enabled";
		} else {
			return "hidden";
		}
	},
});
