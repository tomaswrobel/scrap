import * as Blockly from "blockly/core";
import {TypeToShadow} from "../utils/types";

interface ReturnBlock extends Blockly.BlockSvg {
	addValue(type: string): void;
}

export default <Partial<ReturnBlock>>{
	init(this: ReturnBlock) {
		this.inputsInline = true;
		this.setStyle("procedure_blocks");
		this.appendDummyInput().appendField("return");
		this.setPreviousStatement(true, null);
	},

	saveExtraState(this: ReturnBlock) {
		const input = this.getInput("VALUE");

		return {
			output: input ? input.connection!.getCheck() : false,
		};
	},

	loadExtraState(this: ReturnBlock, state: any) {
		const {output} = this.saveExtraState!();

		if (output !== state.output) {
			this.removeInput("VALUE", true);

			if (state.output !== false) {
				this.addValue(state.output);
			}
		}
	},

	onchange(this: ReturnBlock, e: Blockly.Events.Abstract) {
		if (e instanceof Blockly.Events.BlockMove && e.blockId === this.id) {
			const parent = this.getRootBlock();

			if (parent.type === "function") {
				this.removeInput("VALUE", true);
				const type = parent.getFieldValue("TYPE");
				if (type) {
					this.addValue(type);
				}
			}
		}
	},

	addValue(this: ReturnBlock, type) {
		const input = this.appendValueInput("VALUE").setCheck(type);

		if (Array.isArray(type)) {
			type = type[0];
		}

		if (type in TypeToShadow) {
			const block = this.workspace.newBlock(TypeToShadow[type]);
			block.setShadow(true);
			block.initSvg?.();
			block.render?.();

			input.connection!.connect(block.outputConnection!);
		}
	},
};
