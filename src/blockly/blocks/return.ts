/**
 * This file is a part of Scrap, an educational programming language.
 * You should have received a copy of the MIT License, if not, please 
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomas-wrobel/scrap. 
 * 
 * @license MIT
 * @fileoverview Defines the return block.
 * @author Tomáš Wróbel
 * 
 * Return block is not a mutator, but a standalone block.
 * 
 * This dynamic block handles the return statement.
 * Since the return statement can appear in every function,
 * Scrap handles it for event callbacks and function definitions.
 * 
 * If the return block is inside a function block, it will
 * automatically adapt to the function's return type.
 * 
 * If the return block is not inside a function block, it
 * will remove its value input (return;) and serve like
 * the Scratch's "stop this script" block. 
 */
import * as Blockly from "blockly";
import {TypeToShadow, toCheck} from "../types";

export type ReturnBlock = Blockly.BlockSvg & ReturnBlockMixin;
export interface ReturnBlockMixin extends ReturnBlockMixinType {}
export type ReturnBlockMixinType = typeof MIXIN;
export type ReturnBlockOutput = app.Check | false;

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
				this.removeInput("VALUE");
				if (block?.isShadow()) {
					block.dispose(false);
					this.addValue(state.output, null);
				} else {
					this.addValue(state.output, block);
				}
			} else {
				this.addValue(state.output, null);
			}
		}
	},

	onchange(this: ReturnBlock, e: Blockly.Events.Abstract) {
		if (e instanceof Blockly.Events.BlockMove && e.blockId === this.id && e.recordUndo) {
			const parent = this.getRootBlock();

			if (parent.type === "function") {
				const type = parent.getInput("RETURNS")?.connection?.targetBlock();
				this.loadExtraState!({output: type ? toCheck(type) : false});
			} else {
				this.loadExtraState!({output: false});
			}
		}
	},

	addValue(this: ReturnBlock, check: ReturnBlockOutput, block: Blockly.Block | null) {
		if (!check) {
			return;
		}

		const input = this.appendValueInput("VALUE").setCheck(check);

		if (typeof check === "string") {
			var type = check;
		} else if (check.length === 1) {
			var type = check[0];
		} else {
			var type = "any";
		}

		if (type in TypeToShadow) {
			input.connection!.setShadowState({
				type: TypeToShadow[type]
			});
		}

		block && !input.connection!.connect(block.outputConnection!);
	},

	isEqual(check1: ReturnBlockOutput, check2: ReturnBlockOutput) {
		if (check1 === check2) {
			return true;
		}

		if (typeof check1 === "string" && typeof check2 === "object") {
			return check2.indexOf(check1) !== -1;
		}

		if (typeof check1 === "object" && typeof check2 === "string") {
			return check1.indexOf(check2) !== -1;
		}

		if (typeof check1 === "object" && typeof check2 === "object") {
			if (check1.length === check2.length) {
				return check1.every(p => check2.indexOf(p) !== -1);
			}
		}

		return false;
	}
};