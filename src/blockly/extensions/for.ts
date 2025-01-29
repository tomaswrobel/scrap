/**
 * This file is a part of Scrap Native, an app for helping to migrate
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
import type * as Blockly from "blockly";
import {reserved} from "@scrap/code/transformers/utils";
import Dialog from "@scrap/utils/dialog";

export default function (this: Blockly.BlockSvg) {
	this.customContextMenu = function (options) {
		const [value, type = "any"] = (this.getFieldValue("VAR") as string).split(":");
		options.push({
			text: "Rename variable...",
			callback: () =>
				void Dialog.scrap
					.fire({
						input: "text",
						title: "Rename Variable",
						body: "New name:",
						value,
						inputOptions: {
							pattern: /^[a-zA-Z_$][\w$]*$/,
						},
					})
					.then(name => {
						if (name === false) {
							return;
						}

						if (reserved.includes(name)) {
							void Dialog.scrap.fire({
								title: "Invalid Name",
								body: "This name is reserved by JavaScript.",
								input: "none",
							});
							return;
						}

						this.setFieldValue(`${name}:${type}`, "VAR");
					}),
			enabled: true,
		});
	};
}
