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
        this.setOutputShape(3);

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
            if (block?.type === "variable") {
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