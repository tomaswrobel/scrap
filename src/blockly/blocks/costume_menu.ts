/**
 * @license MIT
 * @fileoverview Costume menu block
 * @author Tomáš Wróbel
 * 
 * Costume menu block is a dropdown with all the costumes.
 * It should be always a shadow block, as it's used in the
 * switch-costume-to block.
 */
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