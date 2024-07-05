/**
 * This file is a part of Scrap, an educational programming language.
 * You should have received a copy of the MIT License, if not, please 
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomas-wrobel/scrap. 
 * 
 * @license Apache-2.0
 * @author Google LLC
 * 
 * @license MIT
 * @author Tomáš Wróbel
 * 
 * From: @blockly/continuous-toolbox@1.0.5
 * To: TypeScript, Scrap modifications
 */
import * as Blockly from "blockly";

export class Category extends Blockly.ToolboxCategory {
	constructor(categoryDef: Blockly.utils.toolbox.CategoryInfo, toolbox: Blockly.IToolbox) {
		super(categoryDef, toolbox);
	}

	override createLabelDom_(name: string) {
		const label = document.createElement("div");
		label.setAttribute("id", this.getId() + ".label");
		label.textContent = name;
		label.classList.add(this.cssConfig_["label"]);
		return label;
	}

	override createIconDom_() {
		const icon = document.createElement("div");
		icon.classList.add("categoryBubble");
		icon.style.backgroundColor = this.colour_;
		return icon;
	}

	override addColourBorder_() {
		// No-op
	}

	override setSelected(isSelected: boolean) {
		if (isSelected) {
			Blockly.utils.dom.addClass(
				this.rowDiv_,
				this.cssConfig_["selected"]
			);
		} else {
			Blockly.utils.dom.removeClass(
				this.rowDiv_,
				this.cssConfig_["selected"]
			);
		}
		Blockly.utils.aria.setState(
			this.htmlDiv_,
			Blockly.utils.aria.State.SELECTED,
			isSelected
		);
	}

	getName(): string {
		const name = super.getName();
		if (name === "Iterables") {
			return "Strings & Arrays";
		}
		return name;
	}
}

export interface Category {
	rowDiv_: HTMLDivElement;
	htmlDiv_: HTMLDivElement;
	cssConfig_: {[key: string]: string;};
}