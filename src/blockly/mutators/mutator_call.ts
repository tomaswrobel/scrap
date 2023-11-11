import * as Blockly from "blockly/core";
import {TypeToShadow, Types} from "../utils/types";

export type CallExtraState = {
	params?: {type: string | string[]}[];
	returnType?: string;
	name?: string;
};

export type CallBlock = Blockly.Block & CallBlockMixin;
export interface CallBlockMixin extends CallBlockMixinType {}
export type CallBlockMixinType = typeof MIXIN;

export const MIXIN = {
	params_: [] as {type: string | string[]}[],
	returnType_: "",
	name_: "unnamed",

	updateShape(this: CallBlock) {
		this.setFieldValue(this.name_, "NAME");
		const returnType = this.returnType_;

		if (returnType || returnType === null) {
			try {
				this.previousConnection?.disconnect();
				this.nextConnection?.disconnect();
			} catch {}
			this.setOutput(true, returnType);
			this.setNextStatement(false);
			this.setPreviousStatement(false);
		} else {
			try {
				this.outputConnection?.disconnect();
			} catch {}
			this.setOutput(false);
			this.setNextStatement(true);
			this.setPreviousStatement(true);
		}

		for (let i = 0; this.removeInput("PARAM_" + i, true); i++);

		for (let i = 0; i < this.params_.length; i++) {
			const {type} = this.params_[i];
			const input = this.appendValueInput(`PARAM_${i}`);
			input.setCheck(type);

			if (typeof type === "object") {
				const block = this.workspace.newBlock("text_or_number");
				block.setShadow(true);

				if (block instanceof Blockly.BlockSvg) {
					block.initSvg();
				}

				input.connection!.connect(block.outputConnection!);
			} else if (type in TypeToShadow && type !== "Boolean") {
				const block = this.workspace.newBlock(TypeToShadow[type]);
				block.setShadow(true);

				if (block instanceof Blockly.BlockSvg) {
					block.initSvg();
					block.render();
				}

				input.connection!.connect(block.outputConnection!);
			}
		}
	},

	saveExtraState(this: CallBlock) {
		return {
			params: this.params_, 
			returnType: this.returnType_, 
			name: this.name_
		};
	},

	loadExtraState(this: CallBlock, state: CallExtraState) {
		this.params_ = state.params ?? [];
		this.returnType_ = state.returnType ?? "";
		this.name_ = state.name ?? "unnamed";

		this.updateShape();
	},
};

export const blocks = Types.map(type => "function_param_" + type);
