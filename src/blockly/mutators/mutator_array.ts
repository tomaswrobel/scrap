import * as Blockly from "blockly/core";

export type ArrayBlock = Blockly.BlockSvg & ArrayBlockMixin;
export interface ArrayBlockMixin extends ArrayBlockMixinType {}
export type ArrayBlockMixinType = typeof MIXIN;

export const MIXIN = {
	items: [] as ("iterable" | "single")[],
	/**
	 * Returns the state of this block as a JSON serializable object.
	 *
	 * @returns The state of this block, ie the item count.
	 */
	saveExtraState(this: ArrayBlock) {
		return {
			items: this.items,
		};
	},
	/**
	 * Applies the given state to this block.
	 *
	 * @param state The state to apply to this block, ie the item count.
	 */
	loadExtraState(this: ArrayBlock, state: any) {
		this.items = state.items;
		this.updateShape();
	},
	/**
	 * Populate the mutator's dialog with this block's components.
	 *
	 * @param workspace Mutator's workspace.
	 * @returns Root block in mutator.
	 */
	decompose: function (
		this: ArrayBlock,
		workspace: Blockly.WorkspaceSvg
	) {
		const containerBlock = workspace.newBlock("array_mutator_items");
		containerBlock.initSvg();
		let connection = containerBlock.nextConnection;
		for (const type of this.items) {
			const itemBlock = workspace.newBlock(
				"array_mutator_item_" + type
			);
			itemBlock.initSvg();
			connection!.connect(itemBlock.previousConnection);
			connection = itemBlock.nextConnection;
		}
		return containerBlock;
	},
	/**
	 * Reconfigure this block based on the mutator dialog's components.
	 *
	 * @param containerBlock Root block in mutator.
	 */
	compose(this: ArrayBlock, containerBlock: Blockly.BlockSvg) {
		let itemBlock = containerBlock.getNextBlock();
		this.items = [];
		// Count number of inputs.
		while (itemBlock) {
			if (itemBlock.isInsertionMarker()) {
				itemBlock = itemBlock.getNextBlock();
				continue;
			}
			this.items.push(itemBlock.type.slice(23) as "iterable" | "single");
			itemBlock = itemBlock.getNextBlock();
		}
		this.updateShape();
	},
	/**
	 * Modify this block to have the correct number of inputs.
	 */
	updateShape(this: ArrayBlock) {
		if (this.items.length && this.getInput("EMPTY")) {
			this.removeInput("EMPTY");
		} else if (!this.items.length && !this.getInput("EMPTY")) {
			this.appendDummyInput("EMPTY").appendField(
				"create empty array"
			);
		}

		// Remove inputs
		for (let i = 0; this.removeInput("ADD" + i, true); i++);

		// Add new inputs.
		for (let i = 0; i < this.items.length; i++) {
			const input = this.appendValueInput("ADD" + i).setAlign(
				Blockly.inputs.Align.RIGHT
			);
			if (i === 0) {
				input.appendField("create array with");
			}
			if (this.items[i] === "iterable") {
				input.setCheck(["String", "Array", "Iterator"]);
				input.appendField("...");
			}
		}
	},
};

export const blocks = ["array_mutator_item_single", "array_mutator_item_iterable"];