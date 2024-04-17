import * as Blockly from "blockly";
import {TypeToShadow} from "../types";

export type ReturnBlock = Blockly.BlockSvg & ReturnBlockMixin;
export interface ReturnBlockMixin extends ReturnBlockMixinType {}
export type ReturnBlockMixinType = typeof MIXIN;
export type ReturnBlockOutput = string[] | false;

export const MIXIN = {
	init(this: ReturnBlock) {
		this.inputsInline = true;
		this.setStyle("Functions");
		this.appendDummyInput().appendField("return");
		this.setPreviousStatement(true, "any");
	},

	saveExtraState(this: ReturnBlock) {
		return {
			output: this.getInput("VALUE")?.connection?.getCheck() || false
		};
	},

	loadExtraState(this: ReturnBlock, state: Record<"output", ReturnBlockOutput>) {
		const {output} = this.saveExtraState();

		if (!this.isEqual(output, state.output)) {
			const input = this.getInput("VALUE");

			if (input) {
				const block = input.connection!.targetBlock();
				input.connection!.disconnect();
				this.removeInput("VALUE");
				this.addValue(state.output, block);
			} else {
				this.addValue(state.output, null);
			}
		}
	},

	onchange(this: ReturnBlock, e: Blockly.Events.Abstract) {
		if (e instanceof Blockly.Events.BlockMove && e.blockId === this.id && e.recordUndo) {
			const parent = this.getRootBlock();

			if (parent.type === "function") {
				const type = parent.getFieldValue("TYPE");
				this.loadExtraState!({output: type});
			} else {

			}
		}
	},

	addValue(this: ReturnBlock, check: ReturnBlockOutput, block: Blockly.Block | null) {
		if (check) {
			const input = this.appendValueInput("VALUE").setCheck(check);
			const type = check.length === 1 ? check[0] : "any";

			if (type in TypeToShadow) {
				input.connection!.setShadowState({
					type: TypeToShadow[type]
				});
			}

			if (block) {
				input.connection!.connect(block.outputConnection!);
			}
		}
	},

	isEqual(check1: ReturnBlockOutput, check2: ReturnBlockOutput) {
		if (check1 === check2) {
			return true;
		}

		if (check1 && check2) {
			if (check1.length === check2.length) {
				return check1.every(p => check2.includes(p));
			}
		}

		return false;
	}
};
