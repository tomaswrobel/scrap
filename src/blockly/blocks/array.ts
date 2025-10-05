/**
 * This file is a part of Scrap, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomaswrobel/scrap.
 *
 * @license MIT
 * @fileoverview Defines the array mutator.
 * @copyright Tomáš Wróbel 2025
 *
 * Array block is different from the Blockly's list block.
 * It supports two types of items: single and iterable.
 * Single items are just values, while iterable items
 * are either strings or arrays - they are expanded
 * into multiple items (via JavaScript's spread operator).
 */
import {blockToCheck} from "@scrap/utils/blockToCheck";
import {CustomBlock} from "@scrap/utils/CustomBlock";
import * as Blockly from "blockly/core";
import {TypeToShadowMap} from "../types";
import type { Check } from "@scrap/types/Check";

export default new CustomBlock(
	{
		items: [] as string[],
		/**
		 * Returns the state of this block as a JSON serializable object.
		 *
		 * @returns The state of this block, ie the item count.
		 */
		saveExtraState() {
			return {
				items: this.items,
			};
		},
		/**
		 * Applies the given state to this block.
		 *
		 * @param state The state to apply to this block, ie the item count.
		 */
		loadExtraState(state: {items?: string[]}) {
			if (state.items) {
				this.items = state.items;
			}
			this.updateShape(blockToCheck(this));
		},
		/**
		 * Populate the mutator's dialog with this block's components.
		 *
		 * @param workspace Mutator's workspace.
		 * @returns Root block in mutator.
		 */
		decompose(workspace: Blockly.WorkspaceSvg) {
			const containerBlock = workspace.newBlock("array_items");
			containerBlock.initSvg();

			let connection = containerBlock.nextConnection;
			for (const type of this.items) {
				const itemBlock = workspace.newBlock(`array_item_${type}`);
				itemBlock.initSvg();
				connection.connect(itemBlock.previousConnection);
				connection = itemBlock.nextConnection;
			}
			return containerBlock;
		},
		/**
		 * Reconfigure this block based on the mutator dialog's components.
		 *
		 * @param containerBlock Root block in mutator.
		 */
		compose(containerBlock: Blockly.BlockSvg) {
			let itemBlock = containerBlock.getNextBlock();
			this.items = [];
			// Count number of inputs.
			while (itemBlock) {
				if (itemBlock.isInsertionMarker()) {
					itemBlock = itemBlock.getNextBlock();
					continue;
				}
				this.items.push(itemBlock.type.slice("array_item_".length));
				itemBlock = itemBlock.getNextBlock();
			}
			this.updateShape(blockToCheck(this));
		},
		/**
		 * Modify this block to have the correct number of inputs.
		 */
		updateShape(check: Check) {
			// Remove inputs
			for (let i = 0; this.removeInput(`ADD${i}`, true); i++) {}

			// Add new inputs.
			for (let i = 0; i < this.items.length; i++) {
				const input = this.appendValueInput(`ADD${i}`).setAlign(
					Blockly.inputs.Align.RIGHT,
				);
				if (this.items[i] === "iterable") {
					input.setCheck("Iterable");
					input.appendField("...");
				} else {
					input.setCheck(check);
					const type =
						typeof check === "string"
							? check
							: check.length === 1
								? check[0]
								: "any";

					if (type in TypeToShadowMap) {
						input.connection!.setShadowState({
							type: TypeToShadowMap[type],
						});
					}
				}
			}
		},

		onchange(e: Blockly.Events.Abstract) {
			if (
				e instanceof Blockly.Events.BlockMove &&
				e.blockId &&
				e.newParentId === this.id
			) {
				const block = this.workspace.getBlockById(e.blockId)!;
				if (block.type === "type") {
					block.setShadow(true);
					this.updateShape(blockToCheck(block));
				}
			}
		},
	},
	["array_item_single", "array_item_iterable"],
);
