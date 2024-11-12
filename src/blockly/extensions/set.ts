/**
 * This file is a part of Scrap Native, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomaswrobel/scrap.
 *
 * @license MIT
 * @fileoverview Blockly's extension for `set` block
 * @copyright Tomáš Wróbel 2024
 *
 * This extension adds corresponding shadow block to the `value` input
 * when the variable is moved to the `set` block.
 */
import * as Blockly from "blockly";
import {TypeToShadow} from "../types";

export default function (this: Blockly.BlockSvg) {
	this.onchange = function (event: Blockly.Events.Abstract) {
		if (
			event instanceof Blockly.Events.BlockMove &&
			event.newParentId === this.id &&
			this.workspace instanceof Blockly.WorkspaceSvg
		) {
			const input = this.getInput("VAR")!;
			const block = input.connection!.targetBlock()!;
			const value = this.getInput("VALUE")!;

			const check = block.outputConnection
				?.getCheck()
				?.filter((c: string) => c !== "Variable");
			const type = check?.length === 1 ? check[0] : "any";

			if (type in TypeToShadow) {
				const thisBlock = value.connection!.targetBlock();

				if (
					thisBlock &&
					thisBlock.isShadow() &&
					thisBlock.type !== TypeToShadow[type]
				) {
					value.connection!.setShadowState({
						type: TypeToShadow[type],
					});
				}
			}
		}
	};
}
