/**
 * This file is a part of Scrap, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomaswrobel/scrap.
 *
 * @license MIT
 * @fileoverview Scratch-like flag icon.
 * @copyright Tomáš Wróbel 2025
 */
import * as Blockly from "blockly/core";
import data from "@material-symbols/svg-400/rounded/flag-fill.svg?url&inline";
import {registerField} from "../utils/registerField";

@registerField("field_flag")
export class FieldFlag extends Blockly.FieldImage {
	constructor() {
		super(data, 24, 24, "flag");
	}

	public static override fromJson() {
		return new this();
	}

	public override initView(): void {
		super.initView();
		this.imageElement?.style.setProperty(
			"filter",
			"invert(69%) sepia(63%) saturate(474%) hue-rotate(71deg) brightness(84%) contrast(84%)",
		);
	}
}
