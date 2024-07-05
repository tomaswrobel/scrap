/**
 * This file is a part of Scrap, an educational programming language.
 * You should have received a copy of the MIT License, if not, please 
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomas-wrobel/scrap. 
 * 
 * @license MIT
 * @copyright Microsoft
 * @author Sam El-Husseini
 * 
 * @license MIT
 * @fileoverview String field.
 * @author Tomáš Wróbel
 * 
 * This file is taken from PXT blockly, with the following modifications:
 * 	- Conversion to TypeScript
 * 	- Using Modern ECMAScript
 * 	- Using Modern DOM API
 * 	- Color Validation
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

	/**
	 * Construct a FieldString from a JSON arg object.
	 * @param {!Object} options A JSON object with options (text).
	 * @returns {!Blockly.FieldString} The new field instance.
	 * @package
	 * @nocollapse
	 */
	static fromJson(options: any): FieldString {
		const text = options["text"];
		const field = new FieldString(text, options["class"]);
		if (typeof options["spellcheck"] == "boolean") {
			field.setSpellcheck(options["spellcheck"]);
		}
		return field;
	}

	/**
	 * Quote padding.
	 * @type {number}
	 * @public
	 */
	static quotePadding = 0;

	/**
	 * Create the block UI for this field.
	 */
	initView() {
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
	protected updateSize_() {
		super.updateSize_();

		let sWidth = this.value_ ? this.size_.width : 10;
		let addedWidth = this.positionLeft(sWidth);

		this.textElement_!.setAttribute("x", `${addedWidth}`);
		addedWidth += this.positionRight(addedWidth + sWidth);

		this.size_.width = sWidth + addedWidth;
	}

	// Position Left
	positionLeft(x: number) {
		if (!this.quoteLeft_) {
			return 0;
		}
		let addedWidth = 0;
		if (this.sourceBlock_!.RTL) {
			this.quoteLeftX_ = x + this.quoteWidth_ + FieldString.quotePadding * 2;
			addedWidth = this.quoteWidth_ + FieldString.quotePadding;
		} else {
			this.quoteLeftX_ = 0;
			addedWidth = this.quoteWidth_ + FieldString.quotePadding;
		}
		this.quoteLeft_.setAttribute("transform", `translate(${this.quoteLeftX_},${this.quoteY_})`);
		return addedWidth;
	}

	// Position Right
	positionRight(x: number) {
		if (!this.quoteRight_) {
			return 0;
		}
		let addedWidth = 0;
		if (this.sourceBlock_!.RTL) {
			this.quoteRightX_ = FieldString.quotePadding;
			addedWidth = this.quoteWidth_ + FieldString.quotePadding;
		} else {
			this.quoteRightX_ = x + FieldString.quotePadding;
			addedWidth = this.quoteWidth_ + FieldString.quotePadding;
		}
		this.quoteRight_.setAttribute("transform", `translate(${this.quoteRightX_},${this.quoteY_})`);
		return addedWidth;
	}

	protected doClassValidation_(newValue?: any): string | null {
		const index = this.sourceBlock_?.outputConnection?.targetConnection?.getCheck()?.indexOf("Color");
		const isInColorInput = index === 0 || (index && index > 0);

		if (!isInColorInput) {
			return newValue;
		}

		newValue = newValue.toLowerCase();

		const hex6 = /^#?[0-9A-F]{6}$/i;

		if (hex6.test(newValue)) {
			if (newValue[0] !== "#") {
				newValue = "#" + newValue;
			}
			return newValue;
		}

		const hex3 = /^#?[0-9A-F]{3}$/i;

		if (hex3.test(newValue)) {
			if (newValue[0] !== "#") {
				newValue = "#" + newValue;
			}
			return newValue.replace(/([0-9A-F])/gi, "$1$1");
		}

		return "#000000";
	}
}
