/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/*
 * Transformed into TypeScript from:
 * @blockly/continuous-toolbox 
 * Slighly modified to Scrap's needs
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