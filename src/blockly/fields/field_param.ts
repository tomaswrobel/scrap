/**
 * This file is a part of Scrap, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomaswrobel/scrap.
 *
 * @license MIT
 * @copyright Tomáš Wróbel 2025
 * @fileoverview Field for parameters in typed blocks
 *
 * scratch-blocks does this by creating an input with irremovable
 * and copiable shadow block. But that requires a modification of
 * the Blockly's Gesture class, which is not possible here.
 * This approach is different, because it uses a field.
 * The field creates a new block and renders it to SVG.
 *
 * Values are stored in the format "name:type".
 * Text is stored in the format "name".
 */
import * as Blockly from "blockly/core";

export default class FieldParam extends Blockly.Field<string> {
	constructor(defaultVarName = "i", type?: Check) {
		super(type ? `${defaultVarName}:${type}` : defaultVarName);
	}

	/**
	 * Extracts the name of the parameter from the value.
	 * @returns The name of the parameter.
	 */
	protected override getText_() {
		return this.value_?.split(":")[0] ?? "";
	}

	/**
	 * Extracts the type of the parameter from the value.
	 * @returns The type of the parameter.
	 */
	public getType() {
		if (!this.value_?.includes(":")) {
			return "any";
		}

		return this.value_.split(":")[1].split(",");
	}

	public setType(newType: Check) {
		this.setValue(`${this.value_?.split(":")[0] ?? ""}:${newType}`);
	}

	public CURSOR = "COPY";
	public override SERIALIZABLE = true;

	public override updateEditable() {
		super.updateEditable();
		// '.blocklyEditableText' makes text black and background white.
		this.fieldGroup_!.classList.remove("blocklyEditableText");
	}

	protected override onMouseDown_(e: PointerEvent): void {
		if (e.button !== 0) {
			// We only want to handle left clicks.
			return;
		}

		if (this.sourceBlock_?.workspace instanceof Blockly.WorkspaceSvg) {
			// Gestures are responsible for dragging blocks around.
			const gesture = this.sourceBlock_.workspace.getGesture(e);
			// Now, the source block is the block that's being dragged.
			if (gesture) {
				const block = this.sourceBlock_.workspace.newBlock("parameter"); // Create a new block.

				// Extract the position of this field.
				const transform = this.fieldGroup_!.getAttribute("transform");
				const transformX = transform?.match(/translate\((\d+)/)?.[1] ?? 0;
				const transformY = transform?.match(/translate\(\d+,(\d+)/)?.[1] ?? 0;
				const {x, y} = this.sourceBlock_
					.getRelativeToSurfaceXY()
					.translate(+transformX, +transformY);

				block.loadExtraState!({
					type: this.getType(), // Set the type of the parameter.
					isConstant:
						this.sourceBlock_.type === "typed" &&
						this.sourceBlock_.getParent()!.getFieldValue("kind") === "const",
				});
				block.setFieldValue(this.getText(), "VAR"); // Set the name of the parameter.
				block.moveBy(x, y); // Move the block to the position of the field.
				block.initSvg(); // Initialize the block.
				block.render(); // Render the block.
				gesture.setStartBlock(block); // Set the block as the block being dragged.
			}
		}
	}

	public static override fromJson(options: Record<string, unknown>) {
		return new FieldParam(options.var as string, options.varType as Check);
	}

	// We do not need to initialize anything,
	// all of the logic is in updateSize_().
	protected override initView() {}

	protected override updateSize_() {
		const workspace = this.sourceBlock_?.workspace;
		if (this.fieldGroup_ && workspace instanceof Blockly.WorkspaceSvg) {
			const block = workspace.newBlock("parameter");
			block.setFieldValue(this.getText(), "VAR");
			block.loadExtraState!({type: this.getType()});
			block.setShadow(true);
			block.initSvg();
			block.renderEfficiently();
			this.fieldGroup_.innerHTML = block.getSvgRoot().outerHTML;
			this.size_ = block.getHeightWidth();
			block.dispose();
		} else {
			this.isDirty_ = true;
		}
	}
}
