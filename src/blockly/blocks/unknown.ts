import * as Blockly from 'blockly/core';

interface UnknownBlock extends Blockly.BlockSvg {
    shape: "command" | "reporter";
    opcode: string;
    updateShape(): void;
}

const COMMENT = `This is a Scrap-incompatible 
block imported from Scratch. 
This block and any blocks 
connected to will not be executed.`;

export default <Partial<UnknownBlock>>{
    shape: "command",
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
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
        } else {
            this.setOutput(true, null);
        }
        this.setFieldValue(this.opcode, "OPCODE");
    },
};