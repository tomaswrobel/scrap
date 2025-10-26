/**
 * This file is a part of Scrap, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomaswrobel/scrap.
 *
 * @license MIT
 * @fileoverview Block imported from Scratch with unknown opcode
 * @copyright Tomáš Wróbel 2025
 *
 * This block is a placeholder for a block that was imported from
 * Scratch and is not compatible with Scrap. It will not be executed.
 *
 * It's dynamic because it initializes with different shapes and
 * opcodes based on the state. This would be possible with static
 * blocks, each with a different shape, but those would need
 * different names. This way, we can reuse the same block.
 */
import {CustomBlock} from "@scrap/utils/CustomBlock.ts";

const COMMENT = `This is a Scrap-incompatible 
block imported from Scratch. 
This block and any blocks 
connected to will not be executed.`;

export default new CustomBlock({
	shape: "command" as "command" | "reporter",
	opcode: "unknown",

	init() {
		this.appendDummyInput()
			.appendField("Unknown block:")
			.appendField(this.opcode, "OPCODE");
		this.setCommentText(COMMENT);
	},

	saveExtraState() {
		return {
			shape: this.shape,
			opcode: this.opcode,
		};
	},

	loadExtraState(state: {shape: "command" | "reporter"; opcode: string}) {
		this.shape = state.shape;
		this.opcode = state.opcode;
		this.updateShape();
	},

	updateShape() {
		if (this.shape === "command") {
			this.setPreviousStatement(true, "any");
			this.setNextStatement(true, "any");
		} else {
			this.setOutput(true, "any");
		}
		this.setFieldValue(this.opcode, "OPCODE");
	},
});
