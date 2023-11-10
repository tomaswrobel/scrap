import type Blockly from "blockly/core";

export default function (this: Blockly.Block) {
	this.onchange = () => {
		const parent = this.getParent();
		if (parent) {
			this.setStyle(parent.getStyleName());
			this.onchange = null;
		}
	};
}