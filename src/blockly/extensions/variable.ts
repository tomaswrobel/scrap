/**
 * This file is a part of Scrap, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomaswrobel/scrap.
 *
 * @license MIT
 * @fileoverview Blockly's extension for `showVariable` and `hideVariable` blocks
 * @copyright Tomáš Wróbel 2025
 *
 * This extension adds a dropdown with all the variables to the block.
 */
import {app} from "@scrap/types/App.svelte.ts";
import {assert} from "@scrap/utils/assert.ts";
import * as Blockly from "blockly/core";

export default function (this: Blockly.Block) {
	const input = this.getInput("DUMMY");
	assert(input);

	const menu = new Blockly.FieldDropdown(() => {
		const variables: Blockly.MenuOption[] = [];

		for (const [name] of app.current.variables) {
			variables.push([name, name]);
		}

		if (app.current.name !== "Stage") {
			for (const [name] of app.stage.variables) {
				variables.push([name, name]);
			}
		}

		return variables;
	});

	input.appendField<string>(menu, "VAR");
}
