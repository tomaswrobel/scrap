/**
 * This file is a part of Scrap Native, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomaswrobel/scrap.
 *
 * @fileoverview Blockly renderer plugin
 * @license MIT
 * @copyright Tomáš Wróbel 2025
 *
 * This plugin edits the default renderer so:
 *
 * - Checkboxes are a bit wider
 * - Type connections are hexagonal (they look like Boolean connections)
 *
 * Note that Scrap uses a square shape for `typed` block, but this is
 * handled in `src/blockly/blocks/typed.ts`. The reason behind the shape
 * is that the `typed` block is just a container for the `type` block
 * and `parameter` field, so it should not be
 */
import * as Blockly from "blockly";

export class ScrapConstantProvider extends Blockly.zelos.ConstantProvider {
	// Make checkboxes a bit wider
	public override FIELD_CHECKBOX_X_OFFSET = 9;

	// Boolean is hexagonal
	// Type is hexagonal
	public override shapeFor(connection: Blockly.RenderedConnection) {
		const check = connection.getCheck();

		if (check?.some(a => a === "boolean" || a === "type")) {
			return this.HEXAGONAL!;
		}

		return super.shapeFor(connection);
	}

	public get cssText() {
		return this.getCSS_("").join("");
	}
}

export class ScrapRenderer extends Blockly.zelos.Renderer {
	protected override makeConstants_() {
		// I am proud to say that... My coding style is disgusting!
		return new ScrapConstantProvider();
	}
}

Blockly.blockRendering.register("scrap", ScrapRenderer);
