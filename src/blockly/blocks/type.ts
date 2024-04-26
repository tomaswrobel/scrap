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