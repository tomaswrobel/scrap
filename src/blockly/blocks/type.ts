/**
 * This file is a part of Scrap, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomaswrobel/scrap.
 *
 * @license MIT
 * @fileoverview Type block
 * @copyright Tomáš Wróbel 2025
 *
 * Type block is a dropdown with all the types.
 *
 * If inside the typed block (which is always
 * inside the variable block), it will change
 * the type of the variable.
 *
 * If inside the array block, it will change
 * the item type of the array.
 *
 * If inside the function block, it will change
 * the return type of the function.
 */
import * as Blockly from "blockly/core";
import {CustomBlock} from "@scrap/utils/CustomBlock.ts";
import type ArrayBlock from "./array.ts";
import {TypeToShadowMap} from "../utils/TypeToShadowMap.ts";
import {ScrapTypes} from "../utils/ScrapTypes.ts";
import {assert} from "@scrap/utils/assert.ts";
import ReturnBlock from "./return.ts";

export default new CustomBlock({
	init() {
		this.setOutput(true, "type");
		this.setStyle("Operators");

		this.appendDummyInput().appendField<string>(
			new Blockly.FieldDropdown(
				ScrapTypes.map(s => [s || "any", s || "any"]),
				type => {
					const parent = this.getParent();

					if (!parent) {
						return type;
					}

					const parentOfParent = parent.getParent();

					if (parent.type === "typed") {
						const param = parent.getField("PARAM");
						assert(param);

						param.setValue(`${param.getText()}:${type}`);
						param.markDirty();

						if (parentOfParent?.type === "variable") {
							const input = parentOfParent.getInput("VALUE");
							assert(input?.connection);

							input.connection?.targetBlock()?.dispose(false);
							input.setCheck(type);

							if (type in TypeToShadowMap) {
								input.connection.setShadowState({
									type: TypeToShadowMap[type],
								});
							}
						}
					}

					if (parent.type === "array") {
						(parent as CustomBlock.Infer<typeof ArrayBlock>).updateShape(type);
					}

					if (parent.type === "function" || parentOfParent?.type === "function") {
						if (this.workspace instanceof Blockly.WorkspaceSvg) {
							this.workspace.refreshToolboxSelection();
						}
					}

					if (parent.type !== "function") {
						return type;
					}

					for (const block of parent.getDescendants(false)) {
						if (block.type !== "return") {
							continue;
						}

						(block as CustomBlock.Infer<typeof ReturnBlock>).loadExtraState({
							output: type,
						});
					}

					return type;
				},
			),
			"TYPE",
		);
	},
});
