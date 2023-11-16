/**
 * @license MIT
 * @fileoverview Defines the call mutator.
 * @author Tomáš Wróbel
 * 
 * Similar to variables, Scrap does not use Blockly's built-in
 * functions. Instead, it uses its own function blocks.
 * It is independent from the Blockly's procedure system.
 * 
 * The benefit of the Blockly's procedure system is that
 * it is more flexible and allows for more workspaces.
 * However, Scrap does not need that flexibility.
 * It would require bigger bundle size, too.
 * 
 * So instead, Scrap uses its own function blocks, which
 * works similarly to legacy Blockly's procedure system.
 * 
 * This mutator is used by the call block. Since Scrap
 * is strongly typed, the call block needs to know the
 * types of the parameters and the return type.
 * It is handled by this mutator, but it is necessary
 * to update the call block's shape in sync with
 * corresponding definitions.
 * 
 * This mutator ensures following:
 * * The call block has a name and a return type.
 * * The call block has parameters.
 * * Parameters are of a specific type.
 * * Corresponding shadow blocks are used inside the parameters.
 */
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

			if (typeof type === "object") { // Array
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
