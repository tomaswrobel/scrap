/**
 * This file is a part of Scrap, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomaswrobel/scrap.
 *
 * @license MIT
 * @fileoverview Property block
 * @copyright Tomáš Wróbel 2025
 *
 * Property block is a block that returns a property of a sprite.
 * It's a dropdown with all the properties (and variables) of a sprite.
 */
import {app} from "@scrap/types/App.svelte";
import type {Check} from "@scrap/types/Check";
import {CustomBlock} from "@scrap/utils/CustomBlock";
import * as Blockly from "blockly/core";

function propertyOptions(spriteName: string) {
	const result: [string, string][] = [
		["width", "width"],
		["height", "height"],
		["volume", "volume"],
		["color effect", "effects.color"],
		["ghost effect", "effects.ghost"],
		["grayscale effect", "effects.grayscale"],
		["brightness effect", "effects.brightness"],
	];

	const sprite = app.entities.find(e => e.name === spriteName);

	if (!sprite) {
		return result;
	}

	if (sprite.name !== "Stage") {
		result.unshift(
			["x", "x"],
			["y", "y"],
			["size", "size"],
			["direction", "direction"],
			["pen size", "penSize"],
			["pen color", "penColor"],
			["visible", "visible"],
			["draggable", "draggable"],
			["costume name", "costume.name"],
			["costume index", "costume.index"],
		);
	}

	for (const [name] of sprite.variables) {
		result.push([name, `variables[${JSON.stringify(name)}]`]);
	}

	return result;
}

export default new CustomBlock({
	category: "sensing",

	// Fields load in order (PROPERTY before SPRITE), but PROPERTY's options depend on SPRITE.
	// Extra state loads before fields, so SPRITE is set first.
	saveExtraState() {
		return {sprite: this.getFieldValue("SPRITE")};
	},

	loadExtraState(state: {sprite: string}) {
		this.setFieldValue(state.sprite, "SPRITE");
	},

	init() {
		this.setOutput(true, ["number", "Variable"]);
		if (this.workspace instanceof Blockly.WorkspaceSvg) {
			this.appendDummyInput()
				.appendField<string>(
					new Blockly.FieldDropdown(
						() => propertyOptions(this.getFieldValue("SPRITE")),
						value => {
							let type: Check;

							if (value === "draggable" || value === "visible") {
								type = "boolean";
							} else if (value.startsWith("variables")) {
								const entity = app.entities.find(
									e => e.name === this.getFieldValue("SPRITE"),
								);
								const variable = entity?.variables.find(
									v => JSON.stringify(v[0]) === value.slice(10, -1),
								);
								if (!variable) {
									return;
								}
								[, type] = variable;
							} else if (value === "penColor") {
								type = "Color";
							} else if (value === "costume.name") {
								type = "string";
							} else {
								type = "number";
							}

							this.setOutput(true, ["Variable"].concat(type));
							return undefined;
						},
					),
					"PROPERTY",
				)
				.appendField("of")
				.appendField<string>(
					new Blockly.FieldDropdown(
						() => app.entities.map<[string, string]>(e => [e.name, e.name]),
						value => {
							const property = this.getFieldValue("PROPERTY");
							if (!propertyOptions(value).some(([, v]) => v === property)) {
								this.setFieldValue("volume", "PROPERTY");
							}
							return undefined;
						},
					),
					"SPRITE",
				);
		} else {
			this.appendDummyInput()
				.appendField(new Blockly.FieldTextInput(), "PROPERTY")
				.appendField(new Blockly.FieldTextInput(), "SPRITE");
		}
	},
});
