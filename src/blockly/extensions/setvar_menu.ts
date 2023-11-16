import * as Blockly from "blockly/core";
import {TypeToShadow} from "../utils/types";

export default function (this: Blockly.Block) {
	const input = this.getInput("VALUE")!;
	const field = this.getField("VAR")!;

	const onChange = (name: string) => {
		const [, type] = false
            || window.app.current.variables.find(([e]) => e === name) 
            || window.app.globalVariables.find(([e]) => e === name)
            || [];

		if (!type || !(type in TypeToShadow)) {
			return name;
		}

		const old = input.connection!.targetBlock();
		if (old) {
			if (old.isShadow()) {
				old.setShadow(false);
				old.dispose(false);
			} else {
				old.unplug();
			}
		}

		input.setCheck(type);

		const block = this.workspace.newBlock(TypeToShadow[type]);
		block.setShadow(true);
		
		if (block instanceof Blockly.BlockSvg) {
			block.initSvg();
			block.render();
		}

		input.connection!.connect(block.outputConnection!);

		return name;
	};

	field.setValidator(onChange);
}