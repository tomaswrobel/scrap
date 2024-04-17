import * as Blockly from "blockly";

export const MIXIN = {
    init(this: Blockly.Block) {
        this.setOutput(true, "string");
        this.setStyle("Sounds");

        this.appendDummyInput().appendField<string>(
            new Blockly.FieldDropdown(
                () => {
                    if (!app.current.sounds) {
                        return [["", ""]];
                    }
                    return app.current.sounds.map<[string, string]>(e => {
                        if (e.name.length > 12) {
                            return [e.name.slice(0, 12) + "...", e.name];
                        }
                        return [e.name, e.name];
                    });
                }
            ),
            "NAME"
        );
    }
};