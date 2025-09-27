/**
 * This file is a part of Scrap, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomaswrobel/scrap.
 *
 * @license MIT
 * @copyright Microsoft
 * @copyright Sam El-Husseini 2025
 *
 * @license MIT
 * @fileoverview String field.
 * @copyright Tomáš Wróbel 2025
 *
 * This file is taken from PXT blockly, with the following modifications:
 * 	- Conversion to TypeScript
 * 	- Using Modern ECMAScript
 * 	- Using Modern DOM API
 *
 */
import * as Blockly from "blockly/core";

export default class FieldString extends Blockly.FieldTextInput {
	private readonly quoteSize = 16;
	private readonly quoteWidth = 8;
	private quoteLeftX = 0;
	private quoteRightX = 0;
	private readonly quoteY = 10;
	private quoteLeft!: SVGTextElement;
	private quoteRight!: SVGTextElement;

	public static override fromJson(options: Record<string, unknown>) {
		const validator = options.class as Blockly.FieldValidator<string>;
		const field = new FieldString(options.text as string, validator);

		if (typeof options.spellcheck === "boolean") {
			field.setSpellcheck(options.spellcheck);
		}

		return field;
	}

	public override initView() {
		// Add quotes around the string
		// Positioned on render, after text size is calculated.
		this.quoteLeft?.remove();
		this.quoteLeft = Blockly.utils.dom.createSvgElement(
			"text",
			{
				"font-size": `${this.quoteSize}px`,
				"font-family": "monospace",
			},
			this.fieldGroup_
		);

		super.initView();

		this.quoteRight?.remove();
		this.quoteRight = Blockly.utils.dom.createSvgElement(
			"text",
			{
				"font-size": `${this.quoteSize}px`,
				"font-family": "monospace",
			},
			this.fieldGroup_
		);

		this.quoteLeft.style.setProperty("fill", "#A31515");
		this.quoteRight.style.setProperty("fill", "#A31515");
		this.textElement_!.style.setProperty("fill", "#A31515");

		this.quoteLeft.append('"');
		this.quoteRight.append('"');
	}

	/**
	 * Updates the size of the field based on the text.
	 */
	protected override updateSize_() {
		super.updateSize_();

		const sWidth = this.value_ ? this.size_.width : 10;
		const addedWidth = this.positionLeft(sWidth);

		this.textElement_!.setAttribute("x", `${addedWidth}`);
		this.size_.width = this.positionRight(addedWidth + sWidth);
	}

	// Position Left
	private positionLeft(x: number) {
		if (!this.quoteLeft) {
			return 0;
		}
		if (this.sourceBlock_!.RTL) {
			this.quoteLeftX = x + this.quoteWidth;
		} else {
			this.quoteLeftX = 0;
		}
		this.quoteLeft.setAttribute("transform", `translate(${this.quoteLeftX},${this.quoteY})`);
		return this.quoteWidth;
	}

	// Position Right
	private positionRight(x: number) {
		if (!this.quoteRight) {
			return 0;
		}
		if (this.sourceBlock_!.RTL) {
			this.quoteRightX = 0;
		} else {
			this.quoteRightX = x;
		}
		this.quoteRight.setAttribute("transform", `translate(${this.quoteRightX},${this.quoteY})`);
		return x + this.quoteWidth;
	}
}
