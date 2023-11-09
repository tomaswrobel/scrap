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
			output: input ? input.connection!.getCheck()![0] : false,
		};
	},

	loadExtraState(this: ReturnBlock, state: any) {
		const {output} = this.saveExtraState!();

		if (output !== state.output) {
			const input = this.getInput("VALUE");

			if (input) {
				const block = input.connection!.targetBlock();
				input.connection!.disconnect();
				this.removeInput("VALUE");

				if (state.output !== false) {
					this.addValue(state.output);
				}

				if (block) {
					const check = block.outputConnection!.getCheck();

					if (!check || check.includes(state.output)) {
						this.getInput("VALUE")!.connection!.connect(block.outputConnection!);
					}
				}
			} else if (state.output !== false) {
				this.addValue(state.output);
			}
		}
	},

	onchange(this: ReturnBlock, e: Blockly.Events.Abstract) {
		if (e instanceof Blockly.Events.BlockMove && e.blockId === this.id && e.recordUndo) {
			const parent = this.getRootBlock();

			if (parent.type === "function") {
				const type = parent.getFieldValue("TYPE");
				this.loadExtraState!({output: type});
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
