import * as Blockly from "blockly/core";
import FieldParam from "../fields/field_param";

export type TryBlock = Blockly.BlockSvg & TryBlockMixin;
export interface TryBlockMixin extends TryBlockMixinType {}
export type TryBlockMixinType = typeof MIXIN;

export const MIXIN = {
    finally: false,
    catch: true as boolean | string,

    saveExtraState(this: TryBlock) {
        return {
            catch: this.catch,
            finally: this.finally,
        };
    },

    loadExtraState(this: TryBlock, state: any) {
        this.catch = state.catch;
        this.finally = state.finally;
        this.updateShape_();
    },

    updateShape_(this: TryBlock) {
        this.removeInput("CATCH-LABEL", true);
        this.removeInput("CATCH", true);
        this.removeInput("FINALLY-LABEL", true);
        this.removeInput("FINALLY", true);

        if (this.catch) {
            const input = this.appendDummyInput("CATCH-LABEL");

            input.appendField("catch");

            if (typeof this.catch === "string") {
                input.appendField(new FieldParam(this.catch));
            }

            this.appendStatementInput("CATCH");
        }
        
        if (this.finally) {
            this.appendDummyInput("FINALLY-LABEL").appendField("finally");
            this.appendStatementInput("FINALLY");
        }

        if (!this.finally && !this.catch) {
            this.setWarningText("Try block has no catch or finally block");
        } else {
            this.setWarningText(null);
        }
    },

    decompose(this: TryBlock, workspace: Blockly.WorkspaceSvg) {
        const containerBlock = workspace.newBlock("try");
        containerBlock.initSvg();

        if (this.catch) {
            if (typeof this.catch === "string") {
                var block = workspace.newBlock("catchVar");
                block.setFieldValue(this.catch, "ERROR");
            } else {
                var block = workspace.newBlock("catch");
            }
            block.initSvg();
            containerBlock.nextConnection!.connect(block.previousConnection!);
        } else {
            var block = containerBlock;
        }

        if (this.finally) {
            const finallyBlock = workspace.newBlock("finally");
            finallyBlock.initSvg();
            block.nextConnection!.connect(finallyBlock.previousConnection!);
        }

        return containerBlock;
    },

    compose(this: TryBlock, containerBlock: Blockly.Block) {
        this.catch = false;
        this.finally = false;

        for (let block = containerBlock.getNextBlock(); block; block = block.getNextBlock()) {
            if (block.type === "catch") {
                this.catch = true;
            } else if (block.type === "catchVar") {
                this.catch = block.getFieldValue("ERROR");
            } else if (block.type === "finally") {
                this.finally = true;
            }
        }

        this.updateShape_();
    }   
};

export const blocks = ["catch", "catchVar", "finally"];