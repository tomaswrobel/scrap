import * as Blockly from 'blockly/core';

export type UnknownBlock = Blockly.BlockSvg & UnknownBlockMixin;
export interface UnknownBlockMixin extends UnknownBlockMixinType {}
export type UnknownBlockMixinType = typeof MIXIN;

const COMMENT = `This is a Scrap-incompatible 
block imported from Scratch. 
This block and any blocks 
connected to will not be executed.`;

export const MIXIN = {
    shape: "command" as "command" | "reporter",
    opcode: "unknown",

    init(this: UnknownBlock) {
        this.appendDummyInput()
            .appendField("Unknown block:")
            .appendField(this.opcode, "OPCODE");
        this.setCommentText(COMMENT);
    },

    saveExtraState(this: UnknownBlock) {
        return {
            shape: this.shape,
            opcode: this.opcode,
        };
    },

    loadExtraState(this: UnknownBlock, state: any) {
        this.shape = state.shape;
        this.opcode = state.opcode;
        this.updateShape();
    },

    updateShape(this: UnknownBlock) {
        if (this.shape === "command") {
            this.setPreviousStatement(true, "any");
            this.setNextStatement(true, "any");
        } else {
            this.setOutput(true, "any");
        }
        this.setFieldValue(this.opcode, "OPCODE");
    },
};