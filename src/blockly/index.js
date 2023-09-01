import * as Blockly from "blockly/core";
import * as blocks from "./blocks/*.ts";
import * as fields from "./fields/*.ts";
import * as mutators from "./mutators/*.ts";

import "@blockly/field-color";
import * as En from "blockly/msg/en";

import blocksData from "./data/blocks.json";
import {Generator, Order} from "./utils/generator.ts";

for (const block in blocks) {
	Blockly.Blocks[block] = blocks[block].default;
}

for (const field in fields) {
	Blockly.fieldRegistry.register(field, fields[field].default);
}

for (const mutator in mutators) {
	Blockly.Extensions.registerMutator(mutator, mutators[mutator].MIXIN, undefined, mutators[mutator].blocks);
}

Blockly.setLocale(En);

const def = [];

for (const type in blocksData) {
	def.push({
		type,
		...blocksData[type],
	});

	const args0 = blocksData[type].args0;
	const isEvent = !("output" in blocksData[type] || "previousStatement" in blocksData[type]);

	if (!(type in Generator.blocks)) {
		Generator.blocks[type] = function (block, generator) {
			let code = `this.${type}`;

			if (args0 || isEvent) {
				const args = [];

				for (const input of args0 || []) {
					if (input.type === "input_value") {
						const value = generator.valueToCode(block, input.name, Order.NONE) || "null";
						args.push(value);
					}
					if (input.type === "input_dummy") {
						const value = block.getFieldValue("NAME");
						args.push(value);
					}
					if (input.type.startsWith("field_")) {
						const value = JSON.stringify(block.getFieldValue(input.name));
						args.push(value);
					}
				}

				if (isEvent) {
					let arg = "function () {";

					if (generator.entity) {
						arg = `async ${arg}`;
					}

					const next = block.getNextBlock();

					if (next) {
						arg += "\n" + generator.prefixLines(generator.blockToCode(next), generator.INDENT);
					}

					args.push(arg + "}");
				}

				code = `${!generator.entity || isEvent ? "" : "await "}${code}(${args.join(", ")})`;
			}

			if (block.outputConnection) {
				return [code, Order.FUNCTION_CALL];
			}

			return code + ";\n";
		};
	}
}

class ContinuousCategory extends Blockly.ToolboxCategory {
	/**
	 * Constructor for ContinuousCategory which is used in ContinuousToolbox.
	 * @override
	 */
	constructor(categoryDef, toolbox) {
		super(categoryDef, toolbox);
	}

	/** @override */
	createLabelDom_(name) {
		const label = document.createElement("div");
		label.setAttribute("id", this.getId() + ".label");
		label.textContent = name;
		label.classList.add(this.cssConfig_["label"]);
		return label;
	}

	/** @override */
	createIconDom_() {
		const icon = document.createElement("div");
		icon.classList.add("categoryBubble");
		icon.style.backgroundColor = this.colour_;
		return icon;
	}

	/** @override */
	addColourBorder_() {
		// No-op
	}

	/** @override */
	setSelected(isSelected) {
		if (isSelected) {
			Blockly.utils.dom.addClass(this.rowDiv_, this.cssConfig_["selected"]);
		} else {
			this.rowDiv_.style.backgroundColor = "";
			Blockly.utils.dom.removeClass(this.rowDiv_, this.cssConfig_["selected"]);
		}
		Blockly.utils.aria.setState(
			/** @type {!Element} */ this.htmlDiv_,
			Blockly.utils.aria.State.SELECTED,
			isSelected
		);
	}
}

Blockly.registry.register(
	Blockly.registry.Type.TOOLBOX_ITEM,
	Blockly.ToolboxCategory.registrationName,
	ContinuousCategory,
	true
);

Blockly.Extensions.register("parent_style", function () {
	this.onchange = () => {
		const parent = this.getParent();
		if (parent) {
			this.setStyle(parent.getStyleName());
			this.onchange = null;
		}
	};
});

Blockly.Msg.PROCEDURES_DEFNORETURN_TITLE = "function";
Blockly.Msg.PROCEDURES_DEFRETURN_TITLE = "function";
Blockly.Msg.MATH_MODULO_TITLE = "%1 mod %2";

delete Blockly.Blocks.controls_if;
delete Blockly.Blocks.controls_if_else;
delete Blockly.Blocks.controls_if_elseif;
delete Blockly.Blocks.controls_if_if;

Blockly.FlyoutButton.TEXT_MARGIN_X = 20;
Blockly.FlyoutButton.TEXT_MARGIN_Y = 10;

Blockly.defineBlocksWithJsonArray(def);
