/**
 * This file is a part of Scrap, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomaswrobel/scrap.
 *
 * @license Apache-2.0
 * @copyright Google LLC 2025
 *
 * From: @blockly/continuous-toolbox@1.0.5
 * To: TypeScript, Scrap modifications
 */
import * as Blockly from "blockly/core";

export class Category extends Blockly.ToolboxCategory {
	constructor(categoryDef: Blockly.utils.toolbox.CategoryInfo, toolbox: Blockly.IToolbox) {
		super(categoryDef, toolbox);
	}

	protected override createLabelDom_(name: string) {
		const label = document.createElement("div");
		label.setAttribute("id", `${this.getId()}.label`);
		label.textContent = name;
		label.classList.add(this.cssConfig_.label);
		return label;
	}

	protected override createIconDom_() {
		const icon = document.createElement("div");
		icon.classList.add("categoryBubble");
		icon.style.backgroundColor = this.colour_;
		return icon;
	}

	protected override addColourBorder_() {
		// No-op
	}

	public override setSelected(isSelected: boolean) {
		if (isSelected) {
			Blockly.utils.dom.addClass(this.rowDiv_, this.cssConfig_.selected);
		} else {
			Blockly.utils.dom.removeClass(this.rowDiv_, this.cssConfig_.selected);
		}
		Blockly.utils.aria.setState(this.htmlDiv_, Blockly.utils.aria.State.SELECTED, isSelected);
	}

	public override getName() {
		const name = super.getName();

		/*
		 * Scrap is intended for kids as well, and the term "Iterables" is not
		 * very friendly. We'll change it to "Strings & Arrays" to be more
		 * understandable. As users discover more in the app, they'll find
		 * out the word "Iterable" elsewhere.
		 */
		if (name === "Iterables") {
			return "Strings & Arrays";
		}

		return name;
	}

	protected declare rowDiv_: HTMLDivElement;
	protected declare htmlDiv_: HTMLDivElement;
	protected declare cssConfig_: Required<Blockly.ToolboxCategory.CssConfig>;
}

Blockly.registry.register(Blockly.registry.Type.TOOLBOX_ITEM, "category", Category, true);
