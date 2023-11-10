import * as Blockly from "blockly/core";

export default <Partial<Blockly.Block>>{
    init(this: Blockly.Block) {
        this.setOutput(true, "Sprite");
        this.setStyle("variable_blocks");
        if (this.workspace instanceof Blockly.WorkspaceSvg) {
            this.appendDummyInput().appendField(
                new Blockly.FieldDropdown(() => {
                    const result = window.app.entities.map<[string, string]>(e => [e.name, e.name]);
                    result[0] = ["myself", "this"];
                    return result;
                }),
                "SPRITE"
            );
            this.onchange = () => {
                const parent = this.getParent();
                if (parent) {
                    this.setStyle(parent.getStyleName());
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
}