/**
 * @license MIT
 * @author Tomáš Wróbel
 * @fileoverview Custom Blockly field for parameters.
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
	constructor(defaultVarName = "i", type?: string) {
		super(type ? `${defaultVarName}:${type}` : defaultVarName);
	}

	/**
	 * Extracts the name of the parameter from the value.
	 * @returns The name of the parameter.
	 */
	protected getText_() {
		return this.value_!.split(":")[0];
	}

	/**
	 * Extracts the type of the parameter from the value.
	 * @returns The type of the parameter.
	 */
	protected getType_() {
		if (this.value_?.indexOf(":") === -1) {
			return null;
		}
		return this.value_!.split(":")[1];
	}

	CURSOR = "COPY";
	SERIALIZABLE = true;

	updateEditable() {
		super.updateEditable();
		// '.blocklyEditableText' makes text black and background white.
		this.fieldGroup_!.classList.remove("blocklyEditableText");
	}

	protected onMouseDown_(e: PointerEvent): void {
		if (e.button !== 0) {
			// We only want to handle left clicks.
			return;
		}

		const workspace = this.sourceBlock_?.workspace;

		if (workspace instanceof Blockly.WorkspaceSvg) {
			// Gestures are responsible for dragging blocks around.
			const gesture = workspace.getGesture(e);
			// Now, the source block is the block that's being dragged.
			if (gesture) {
				const block = workspace.newBlock("parameter"); // Create a new block.

				// Extract the position of this field.
				const transform = this.fieldGroup_!.getAttribute("transform");
				const transformX = transform?.match(/translate\((\d+)/)?.[1] ?? 0;
				const transformY = transform?.match(/translate\(\d+,(\d+)/)?.[1] ?? 0;
				const {x, y} = this.sourceBlock_!.getRelativeToSurfaceXY().translate(+transformX, +transformY);
				
				block.setOutput(true, this.getType_()); // Set the type of the parameter.
				block.setFieldValue(this.getText(), "VAR"); // Set the name of the parameter.
				block.moveBy(x, y); // Move the block to the position of the field.
				block.initSvg(); // Initialize the block.
				block.render(); // Render the block.
				gesture.setStartBlock(block); // Set the block as the block being dragged.
			}
		}
	}

	static fromJson(options: Record<string, any>) {
		return new FieldParam(options.var, options.varType);
	}

	// We do not need to initialize anything,
	// all of the logic is in updateSize_().
	initView() {}

	protected updateSize_() {
		const workspace = this.sourceBlock_?.workspace;
		if (this.fieldGroup_ && workspace instanceof Blockly.WorkspaceSvg) {
			const block = workspace.newBlock("parameter");
			block.setFieldValue(this.getText(), "VAR");
			block.setOutput(true, this.getType_());
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
