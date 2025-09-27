/**
 * This file is a part of Scrap, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomaswrobel/scrap.
 *
 * @license MIT
 * @fileoverview Costume menu block
 * @copyright Tomáš Wróbel 2025
 *
 * Costume menu block is a dropdown with all the costumes.
 * It should be always a shadow block, as it's used in the
 * switch-costume-to block.
 */
import { CustomBlock } from "@scrap/utils/CustomBlock";
import * as Blockly from "blockly/core";
import * as path from "path";

export default new CustomBlock({
	init() {
		this.setStyle("Looks");
		this.setOutput(true, "string");

		this.appendDummyInput().appendField<string>(
			new Blockly.FieldDropdown(() =>
				app.current.costumes.map<[string, string]>(e => {
					const { name } = path.parse(e.name);
					if (name.length > 12) {
						return [`${name.slice(0, 12)}...`, name];
					}
					return [name, name];
				})
			),
			"NAME"
		);
	},
});
