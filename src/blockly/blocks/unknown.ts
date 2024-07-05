/**
 * This file is a part of Scrap, an educational programming language.
 * You should have received a copy of the MIT License, if not, please 
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomas-wrobel/scrap. 
 * 
 * @license MIT
 * @fileoverview Block imported from Scratch with unknown opcode
 * @author Tomáš Wróbel
 * 
 * This block is a placeholder for a block that was imported from
 * Scratch and is not compatible with Scrap. It will not be executed.
 * 
 * It's dynamic because it initializes with different shapes and
 * opcodes based on the state. This would be possible with static
 * blocks, each with a different shape, but those would need
 * different names. This way, we can reuse the same block.
 */
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