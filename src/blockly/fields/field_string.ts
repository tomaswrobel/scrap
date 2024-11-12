/**
 * This file is a part of Scrap Native, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomaswrobel/scrap.
 *
 * @license MIT
 * @copyright Microsoft
 * @author Sam El-Husseini
 *
 * @license MIT
 * @fileoverview String field.
 * @copyright Tomáš Wróbel 2024
 *
 * This file is taken from PXT blockly, with the following modifications:
 * 	- Conversion to TypeScript
 * 	- Using Modern ECMAScript
 * 	- Using Modern DOM API
 *
 */
import * as Blockly from "blockly";

export default class FieldString extends Blockly.FieldTextInput {
	private quoteSize_ = 16;
	private quoteWidth_ = 8;
	private quoteLeftX_ = 0;
	private quoteRightX_ = 0;
	private quoteY_ = 10;
	private quoteLeft_!: SVGTextElement;
	private quoteRight_!: SVGTextElement;

	public static override fromJson(options: Record<string, unknown>) {
		const text = options["text"] as string;
		const validator = options["class"] as Blockly.FieldValidator<string>;
		const field = new FieldString(text, validator);
		if (typeof options["spellcheck"] == "boolean") {
			field.setSpellcheck(options["spellcheck"]);
		}
		return field;
	}

	public override initView() {
		// Add quotes around the string
		// Positioned on render, after text size is calculated.
		this.quoteLeft_?.remove();
		this.quoteLeft_ = Blockly.utils.dom.createSvgElement(
			"text",
			{
				"font-size": this.quoteSize_ + "px",
				"font-family": "monospace",
			},
			this.fieldGroup_
		);

		super.initView();

		this.quoteRight_?.remove();
		this.quoteRight_ = Blockly.utils.dom.createSvgElement(
			"text",
			{
				"font-size": this.quoteSize_ + "px",
				"font-family": "monospace",
			},
			this.fieldGroup_
		);

		this.quoteLeft_.style.setProperty("fill", "#A31515");
		this.quoteRight_.style.setProperty("fill", "#A31515");
		this.textElement_!.style.setProperty("fill", "#A31515");

		this.quoteLeft_.append('"');
		this.quoteRight_.append('"');
	}

	/**
	 * Updates the size of the field based on the text.
	 */
	protected override updateSize_() {
		super.updateSize_();

		const sWidth = this.value_ ? this.size_.width : 10;
		let addedWidth = this.positionLeft(sWidth);

		this.textElement_!.setAttribute("x", `${addedWidth}`);
		addedWidth += this.positionRight(addedWidth + sWidth);

		this.size_.width = sWidth + addedWidth;
	}

	// Position Left
	private positionLeft(x: number) {
		if (!this.quoteLeft_) {
			return 0;
		}
		if (this.sourceBlock_!.RTL) {
			this.quoteLeftX_ = x + this.quoteWidth_;
		} else {
			this.quoteLeftX_ = 0;
		}
		this.quoteLeft_.setAttribute(
			"transform",
			`translate(${this.quoteLeftX_},${this.quoteY_})`
		);
		return this.quoteWidth_;
	}

	// Position Right
	private positionRight(x: number) {
		if (!this.quoteRight_) {
			return 0;
		}
		if (this.sourceBlock_!.RTL) {
			this.quoteRightX_ = 0;
		} else {
			this.quoteRightX_ = x;
		}
		this.quoteRight_.setAttribute(
			"transform",
			`translate(${this.quoteRightX_},${this.quoteY_})`
		);
		return this.quoteWidth_;
	}
}
