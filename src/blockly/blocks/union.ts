// oxlint-disable no-param-reassign
/**
 * This file is a part of Scrap, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomaswrobel/scrap.
 *
 * @license MIT
 * @fileoverview Union block
 * @copyright Tomáš Wróbel 2025
 *
 * Union block groups types together. It's a
 * dynamic block with a mutator.
 */
import {CustomBlock} from "@scrap/utils/CustomBlock";
import * as Blockly from "blockly/core";

export default new CustomBlock({
	count: 2,

	init() {
		this.inputsInline = true;
		this.setOutput(true, "type");
		this.setStyle("Operators");
		this.setMutator(new Blockly.icons.MutatorIcon(["union:type"], this));
		this.updateShape(); // That's why it is a dynamic block
	},
	saveExtraState() {
		return {count: this.count};
	},
	loadExtraState(state: {count?: number}) {
		const {count} = this;
		this.count = state.count || 2;
		this.updateShape(count);
	},
	compose(block: Blockly.Block | null) {
		const {count} = this;
		this.count = 0;

		while (block) {
			this.count++;
			block = block.getNextBlock();
		}

		this.updateShape(count);
	},
	decompose(workspace: Blockly.WorkspaceSvg) {
		const top = workspace.newBlock("union:type");
		top.initSvg?.();

		for (let i = 1, connection = top.nextConnection; i < this.count; i++) {
			const block = workspace.newBlock("union:type");
			block.initSvg?.();
			block.previousConnection.connect(connection);
			connection = block.nextConnection;
		}

		return top;
	},
	updateShape(previous = 0) {
		if (previous > this.count) {
			while (previous > this.count) {
				this.removeInput(`TYPE${--previous}`);
			}
		} else if (previous < this.count) {
			while (previous < this.count) {
				this.appendValueInput(`TYPE${previous}`)
					.setCheck("type")
					.appendField(previous++ ? "or" : "any of");
			}
		}
	},
});
