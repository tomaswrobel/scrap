/**
 * This file is a part of Scrap, an educational programming language.
 * You should have received a copy of the MIT License, if not, please 
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomas-wrobel/scrap. 
 * 
 * @license MIT
 * @fileoverview Typed block
 * @author Tomáš Wróbel
 * 
 * Typed block is inside the variable block or the function block.
 * It serves as a container with own data model.
 * 
 * It's the only block that has a square output shape. While it's
 * not hard for user to notice that it's a separate block, the shape
 * and the immovability of the block help to blend it in with the
 * parent block.
 */
import * as Blockly from "blockly";
import FieldParam from "../fields/field_param";
import FieldIdentifier from "../fields/field_identifier";
import {toCheck} from "../types";

export type TypedBlock = Blockly.BlockSvg & TypedBlockMixin;
export interface TypedBlockMixin extends TypedBlockMixinType {}
export type TypedBlockMixinType = typeof MIXIN;

export const MIXIN = {
    init(this: TypedBlock) {
        this.setStyle("Functions");
        this.setOutput(true);
        this.setMovable(false);
        this.setOutputShape(3); // Square

        const input = this.appendValueInput("TYPE");

        input.setCheck("type");
        input.appendField(new FieldParam(), "PARAM");
        input.appendField(":");

        this.customContextMenu = function (options) {
            if (this.getParent()?.type === "function") {
                return;
            }
            options.push({
                text: "Rename variable...",
                callback: () => {
                    const parameter = this.getField("PARAM");
                    if (parameter instanceof FieldParam) {
                        const name = parameter.getText();
                        const type = parameter.getType();

                        const field = new FieldIdentifier(name);
                        field.onFinish = result => {
                            input.removeField("PARAM");
                            input.insertFieldAt(
                                0,
                                new FieldParam(result, type),
                                "PARAM"
                            );
                        };

                        input.removeField("PARAM");
                        input.insertFieldAt(0, field, "PARAM");

                        field.showEditor();
                    }
                },
                enabled: true,
            });
        };

        let observed = "";

        this.onchange = function (e: Blockly.Events.Abstract) {
            const block = this.getParent();
            if (!block) {
                // Dispose if not inside a block.
                // This logic was moved from the parent block,
                // as it was buggy due to Blockly's event system.
                this.dispose(false);
            } else if (block.type === "variable") {
                if (e instanceof Blockly.Events.BlockMove && e.blockId) {
                    if (e.newParentId === this.id) {
                        const type = this.getInput("TYPE")?.connection?.targetBlock();
                        const input = block.getInput("VALUE")!;
                        input.connection!.targetBlock()?.dispose(false);
                        input.setCheck(toCheck(type));

                        if (type?.type === "type") {
                            const field = type.getField("TYPE")!;
                            field.markDirty();
                        }
                    }
                    if (e.oldParentId === this.id) {
                        if (e.blockId === observed) {
                            return;
                        }
                        const type = this.getInput("TYPE")?.connection?.targetBlock();
                        const input = block.getInput("VALUE")!;
                        input.connection!.targetBlock()?.dispose(false);
                        input.setCheck(toCheck(type));
                        observed = e.blockId;
                        if (type?.type === "type") {
                            const field = type.getField("TYPE")!;
                            field.markDirty();
                        }
                    }
                }
            }
        };
    },
};