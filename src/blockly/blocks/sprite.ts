import * as Blockly from "blockly";

export const MIXIN = {
    init(this: Blockly.Block) {
        this.setOutput(true, "Sprite");
        this.setStyle("Variables");
        if (this.workspace instanceof Blockly.WorkspaceSvg) {
            this.appendDummyInput().appendField<string>(
                new Blockly.FieldDropdown(() => {
                    const result = app.entities.map<[string, string]>(e => [e.name, e.name]);
                    result[0] = ["self", "self"];
                    return result;
                }),
                "SPRITE"
            );
            this.onchange = () => {
                const parent = this.getParent();
                if (parent) {
                    this.setStyle(parent.getStyleName());
                    this.onchange = null;
                } else if (!this.isShadow()) {
                    this.onchange = null;
                }
            };
        } else {
            this.appendDummyInput().appendField(
                new Blockly.FieldTextInput(),
                "SPRITE"
            );
        }
    },
};