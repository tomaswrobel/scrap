/**
 * This file is a part of Scrap Native, an app for helping to migrate
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
import data from "@scrap/assets/icons/stage/flag.svg";

export default class extends Blockly.FieldImage {
	constructor() {
		super(data, 24, 24, "flag");
	}

	public static override fromJson() {
		return new this();
	}
}
