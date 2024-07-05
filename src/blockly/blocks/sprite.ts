/**
 * This file is a part of Scrap, an educational programming language.
 * You should have received a copy of the MIT License, if not, please 
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomas-wrobel/scrap. 
 * 
 * @license MIT
 * @fileoverview Sprite block
 * @author Tomáš Wróbel
 * 
 * Sprite block is a dropdown with all the sprtes. It 
 * should be always a shadow block, and it adapts to
 * the style of the parent block.
 * 
 * Also, it has an option to select "self" which is
 * a reference to the sprite that the script is running
 */
import * as Blockly from "blockly";

export const MIXIN = {
    init(this: Blockly.Block) {
        this.setOutput(true, "Sprite");
        this.setStyle("Variables");
        if (this.workspace instanceof Blockly.WorkspaceSvg) {
            this.appendDummyInput().appendField<string>(
                new Blockly.FieldDropdown(() => {
                    const result = app.entities.map<[string, string]>(e => [e.name, e.name]);
                    result[0] = ["self", "self"]; // Replace Stage with self
                    return result;
                }),
                "SPRITE"
            );
            // Dynamically set the style to the parent's style
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