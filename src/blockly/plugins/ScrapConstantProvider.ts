/**
 * This file is a part of Scrap, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomaswrobel/scrap.
 *
 * @fileoverview Blockly constant provider plugin
 * @license MIT
 * @copyright Tomáš Wróbel 2025
 *
 * This plugin edits the constant provider so:
 *
 * - Checkboxes are a bit wider
 * - Fields uses Geist font
 * - Type connections are hexagonal (they look like Boolean connections)
 *
 * Note that Scrap uses a square shape for `typed` block, but this is
 * handled in `src/blockly/blocks/typed.ts`. The reason behind the shape
 * is that the `typed` block is just a container for the `type` block
 * and `parameter` field, so it should not be
 */
import {assert} from "@scrap/utils/assert.ts";
import * as Blockly from "blockly/core";

export class ScrapConstantProvider extends Blockly.zelos.ConstantProvider {
	// Make checkboxes a bit wider
	public override FIELD_CHECKBOX_X_OFFSET = 9;

	// Boolean is hexagonal
	// Type is hexagonal
	public override shapeFor(connection: Blockly.RenderedConnection) {
		const check = connection.getCheck();

		if (check?.some(a => a === "boolean" || a === "type")) {
			assert(this.HEXAGONAL);
			return this.HEXAGONAL;
		}

		return super.shapeFor(connection);
	}

	public get cssText() {
		return this.getCSS_("").join("");
	}

	public override FIELD_TEXT_FONTFAMILY = "Geist";
}
