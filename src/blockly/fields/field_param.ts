import * as Blockly from "blockly/core";

export default class FieldParam extends Blockly.Field<string> {
	constructor(defaultVarName ="i", type?: string) {
		super(type ? `${defaultVarName}:${type}` : defaultVarName);
	}

    protected getText_() {
        return this.value_!.split(":")[0];
    }

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
		this.fieldGroup_!.classList.remove("blocklyEditableText");
	}

	protected onMouseDown_(e: PointerEvent): void {
		if (e.button !== 0) {
			return;
		}

		const workspace = this.sourceBlock_?.workspace;

		if (workspace instanceof Blockly.WorkspaceSvg) {
			const gesture = workspace.getGesture(e);
			if (gesture) {
				const name = this.getText();
				const block = workspace.newBlock("parameter");
                block.setOutput(true, this.getType_());
				const transform = this.fieldGroup_!.getAttribute("transform");
				const transformX = transform?.match(/translate\((\d+)/)?.[1] ?? 0;
				const transformY = transform?.match(/translate\(\d+,(\d+)/)?.[1] ?? 0;
				const {x, y} = this.sourceBlock_!.getRelativeToSurfaceXY().translate(
					Number(transformX),
					Number(transformY)
				);
				block.setFieldValue(name, "VAR");
				block.moveBy(x, y);
				block.initSvg();
				block.render();
				gesture.setStartBlock(block);
			}
		}
	}

	static fromJson(options: Record<string, any>) {
		return new FieldParam(options.var, options.varType);
	}

	bbox?: DOMRect;

	initView() {
		const workspace = this.sourceBlock_?.workspace;

		try {
			const block = (workspace as Blockly.WorkspaceSvg).newBlock("parameter");
			block.setFieldValue(this.getText(), "VAR");
            block.setOutput(true, this.getType_());
			block.setShadow(true);
			block.initSvg();
			block.renderEfficiently();
			this.fieldGroup_!.append(block.getSvgRoot().cloneNode(true));
			block.dispose();
		} catch (e) {
			// Block cannot be rendered
		}
	}

	protected updateSize_() {
		if (this.fieldGroup_) {
			const bbox = this.fieldGroup_.getBBox();
			this.size_.width = bbox.width;
			this.size_.height = bbox.height;
		} else {
			this.isDirty_ = true;
			super.updateSize_();
		}
	}
}
