/**
 * This file is a part of Scrap, an educational programming language.
 * You should have received a copy of the MIT License, if not, please 
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomas-wrobel/scrap. 
 * 
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
import * as Blockly from "blockly";
import {TypeToShadow} from "../types";

export type CallExtraState = {
	params?: app.Check[];
	returnType?: app.Check | false;
	name?: string;
};

export type CallBlock = Blockly.Block & CallBlockMixin;
export interface CallBlockMixin extends CallBlockMixinType {}
export type CallBlockMixinType = typeof MIXIN;

export const MIXIN = {
	params_: [] as app.Check[],
	returnType_: "any" as app.Check | false,
	name_: "unnamed",

	updateShape(this: CallBlock) {
		this.setFieldValue(this.name_, "NAME");
		const returnType = this.returnType_;

		if (returnType) {
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
			this.setNextStatement(true, "any");
			this.setPreviousStatement(true, "any");
		}

		for (let i = 0; this.removeInput("PARAM_" + i, true); i++);

		for (let i = 0; i < this.params_.length; i++) {
			const type = this.params_[i];
			const input = this.appendValueInput(`PARAM_${i}`);
			input.setCheck(type);

			if (typeof type === "object") { // Array
				input.connection!.setShadowState({
					type: "text_or_number"
				});
			} else if (type in TypeToShadow) {
				input.connection!.setShadowState({
					type: TypeToShadow[type]
				});
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
		this.returnType_ = state.returnType ?? "any";
		this.name_ = state.name ?? "unnamed";

		this.updateShape();
	},
};