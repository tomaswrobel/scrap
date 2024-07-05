/**
 * This file is a part of Scrap, an educational programming language.
 * You should have received a copy of the MIT License, if not, please 
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomas-wrobel/scrap. 
 * 
 * @license MIT
 * @fileoverview Defines the function mutator.
 * @author Tomáš Wróbel
 * 
 * Similar to variables, Scrap does not use Blockly's built-in
 * functions. Instead, it uses its own function blocks.
 * It is independent from the Blockly's procedure system.
 * 
 * The benefit of the Blockly's procedure system is that
 * it is more flexible and allows for more workspaces.
 * However, Scrap does not need that flexibility.
 * It would require bigger bundle size, too.
 * 
 * So instead, Scrap uses its own function blocks, which
 * works similarly to legacy Blockly's procedure system.
 */
import * as Blockly from "blockly";

export type FunctionBlock = Blockly.BlockSvg & FunctionBlockMixin;
export interface FunctionBlockMixin extends FunctionBlockMixinType {}
export type FunctionBlockMixinType = typeof MIXIN;
export type FunctionTypeAnnotation = Blockly.serialization.blocks.State | null;

const dom = Blockly.utils.xml.createElement("shadow");
dom.setAttribute("type", "type");

export const MIXIN = {
    params: new Array<string>(),
    returns: false,

    saveExtraState(this: FunctionBlock) {
        return {
            params: this.params,
            returns: this.returns
        };
    },

    loadExtraState(this: FunctionBlock, state: any) {
        this.params = state.params || [];
        this.returns = state.returns || false;
        this.updateShape();
    },

    compose(this: FunctionBlock, topBlock: Blockly.Block) {
        this.returns = false;
        this.params = [];

        for (let block = topBlock.getNextBlock(); block; block = block.getNextBlock()) {
            if (block.type === "function_returns") {
                this.returns = true;
            } else {
                this.params.push(block.getFieldValue("NAME"));
            }
        }

        this.updateShape();
    },

    decompose(this: FunctionBlock, workspace: Blockly.WorkspaceSvg) {
        const containerBlock = workspace.newBlock("function_header");
        containerBlock.initSvg?.();
        let connection = containerBlock.nextConnection;

        for (const name of this.params) {
            const block = workspace.newBlock("function_param");
            block.initSvg?.();
            block.setFieldValue(name, "NAME");
            connection.connect(block.previousConnection);
            connection = block.nextConnection;
        }

        if (this.returns) {
            const block = workspace.newBlock("function_returns");
            block.initSvg?.();
            block.previousConnection.connect(connection);
        }

        return containerBlock;
    },

    updateShape(this: FunctionBlock) {
        let input = this.getInput("RETURNS");

        if (input && !this.returns) {
            this.removeInput("RETURNS");
            input = null;
        }

        for (var i = 0; i < this.params.length; i++) {
            const typed = this.getInput("PARAM_" + i);

            if (!typed) {
                const block = this.workspace.newBlock("typed");
                block.getInput("TYPE")!.setShadowDom(dom);
                block.setFieldValue(this.params[i], "PARAM");
                block.initSvg?.();
                block.render?.();

                this.appendValueInput("PARAM_" + i).connection!.connect(
                    block.outputConnection!
                );
            } else {
                const block = typed.connection!.targetBlock()!;
                const value = block.getFieldValue("PARAM");

                block.setFieldValue(`${this.params[i]}:${value.split(":")[1] || "any"}`, "PARAM");
            }

            if (input) {
                this.moveInputBefore("PARAM_" + i, "RETURNS");
            }
        }

        for (let input = this.getInput("PARAM_" + i); input; input = this.getInput("PARAM_" + ++i)) {
            this.removeInput("PARAM_" + i);
        }

        if (!input && this.returns) {
            this.appendValueInput("RETURNS")
                .setCheck("type")
                .setShadowDom(dom)
                .appendField("returns");
        }
    }
};

export const blocks = ["function_param", "function_returns"];