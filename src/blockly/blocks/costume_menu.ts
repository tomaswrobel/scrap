import * as Blockly from "blockly";

export const MIXIN = {
    init(this: Blockly.Block) {
        this.setStyle("Looks");
        this.setOutput(true, "string");

        this.appendDummyInput().appendField<string>(
            new Blockly.FieldDropdown(
                () => app.current.costumes.map<[string, string]>(e => {
                    if (e.name.length > 12) {
                        return [e.name.slice(0, 12) + "...", e.name];
                    }
                    return [e.name, e.name];
                })
            ),
            "NAME"
        );
    }
};