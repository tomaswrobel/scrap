/**
 * @license MIT
 * @fileoverview Sound block
 * @author Tomáš Wróbel
 * 
 * Sound block is a dropdown with all the sounds. It 
 * should be always a shadow block, as it's used in 
 * the play-sound block.
 */
import * as Blockly from "blockly";
import path from "path";

export const MIXIN = {
    init(this: Blockly.Block) {
        this.setOutput(true, "string");
        this.setStyle("Sounds");

        this.appendDummyInput().appendField<string>(
            new Blockly.FieldDropdown(
                () => {
                    if (!app.current.sounds.length) {
                        return [["", ""]];
                    }
                    return app.current.sounds.map<[string, string]>(e => {
                        const {name} = path.parse(e.name);
                        if (name.length > 12) {
                            return [name.slice(0, 12) + "...", name];
                        }
                        return [name, name];
                    });
                }
            ),
            "NAME"
        );
    }
};