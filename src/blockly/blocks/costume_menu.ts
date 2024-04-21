import * as Blockly from "blockly";
import path from "path";

export const MIXIN = {
    init(this: Blockly.Block) {
        this.setStyle("Looks");
        this.setOutput(true, "string");

        this.appendDummyInput().appendField<string>(
            new Blockly.FieldDropdown(
                () => app.current.costumes.map<[string, string]>(e => {
                    const {name} = path.parse(e.name);
                    if (name.length > 12) {
                        return [name.slice(0, 12) + "...", name];
                    }
                    return [name, name];
                })
            ),
            "NAME"
        );
    }
};