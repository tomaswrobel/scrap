import * as Blockly from "blockly/core";

export default {
	init(this: Blockly.Block) {
		this.inputsInline = true;
		this.appendDummyInput().appendField("yield");
		this.appendValueInput("VALUE");
		this.setPreviousStatement(true);
		this.setNextStatement(true);
		this.setStyle("procedure_blocks");
	},

	onchange(this: Blockly.Block, e: Blockly.Events.Abstract) {
		if (e instanceof Blockly.Events.BlockBase && e.blockId === this.id) {
			const parent = this.getRootBlock();

			if (parent.type === "function") {
				if (parent.getFieldValue("label") !== "function*") {
					this.setWarningText("This block must be inside a generator function.");
					return;
				}
			} else {
				this.setWarningText("This block must be inside a generator function.");
                return;
			}

			this.setWarningText(null);
		}
	},
};
