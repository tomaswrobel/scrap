/**
 * This file is a part of Scrap, an educational programming language.
 * You should have received a copy of the MIT License, if not, please 
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomas-wrobel/scrap. 
 * 
 * @license MIT
 * @fileoverview Type block
 * @author Tomáš Wróbel
 * 
 * Type block is a dropdown with all the types.
 * 
 * If inside the typed block (which is always 
 * inside the variable block), it will change 
 * the type of the variable.
 * 
 * If inside the array block, it will change
 * the item type of the array.
 * 
 * If inside the function block, it will change
 * the return type of the function.
 */
import * as Blockly from "blockly";
import {TypeToShadow, Types} from "../types";
import type {ArrayBlock} from "./array";

export const MIXIN = {
    init(this: Blockly.Block) {
        this.setOutput(true, "type");
        this.setStyle("Operators");

        this.appendDummyInput()
            .appendField<string>(
                new Blockly.FieldDropdown(
                    Types.map(s => [s || "any", s || "any"]),
                    type => {
                        if (this.parentBlock_?.type === "typed") {
                            const param = this.parentBlock_.getField("PARAM")!;

                            param.setValue(`${param.getText()}:${type}`);
                            param.markDirty();

                            if (this.parentBlock_.parentBlock_?.type === "variable") {
                                const input = this.parentBlock_.parentBlock_.getInput("VALUE")!;
                                input.connection?.targetBlock()?.dispose(false);
                                input.setCheck(type);

                                if (type in TypeToShadow) {
                                    input.connection!.setShadowState({
                                        type: TypeToShadow[type]
                                    });
                                }
                            }
                        }

                        if (this.parentBlock_?.type === "array") {
                            (this.parentBlock_ as ArrayBlock).updateShape(type);
                        }

                        if (this.parentBlock_?.type === "function" || this.parentBlock_?.parentBlock_?.type === "function") {
                            if (this.workspace instanceof Blockly.WorkspaceSvg) {
                                this.workspace.refreshToolboxSelection();
                            }
                        }
                        
                        if (this.parentBlock_?.type === "function") {
                            for (const block of this.parentBlock_.getDescendants(false)) {
                                if (block.type === "return") {
                                    block.loadExtraState!({
                                        output: type
                                    });
                                }
                            }   
                        }

                        return type;
                    }
                ),
                "TYPE"
            );
    }
};