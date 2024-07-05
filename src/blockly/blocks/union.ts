/**
 * This file is a part of Scrap, an educational programming language.
 * You should have received a copy of the MIT License, if not, please 
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomas-wrobel/scrap. 
 * 
 * @license MIT
 * @fileoverview Union block
 * @author Tomáš Wróbel
 * 
 * Union block groups types together. It's a
 * dynamic block with a mutator.
 */
import * as Blockly from "blockly";

export type UnionBlock = Blockly.BlockSvg & UnionBlockMixin;
export interface UnionBlockMixin extends UnionBlockMixinType {}
export type UnionBlockMixinType = typeof MIXIN;

export const MIXIN = {
    count: 2,

    init(this: UnionBlock) {
        this.inputsInline = true;
        this.setOutput(true, "type");
        this.setStyle("Operators");
        this.setMutator(
            new Blockly.icons.MutatorIcon(
                ["union:type"], this
            )
        );
        this.updateShape(); // That's why it is a dynamic block
    },
    saveExtraState() {
        return {count: this.count};
    },
    loadExtraState(this: UnionBlock, state: any) {
        const count = this.count;
        this.count = state.count || 2;
        this.updateShape(count);
    },
    compose(this: UnionBlock, block: Blockly.Block | null) {
        const count = this.count;
        this.count = 0;

        while (block) {
            this.count++;
            block = block.getNextBlock();
        }

        this.updateShape(count);
    },
    decompose(workspace: Blockly.WorkspaceSvg) {
        const top = workspace.newBlock("union:type");
        top.initSvg?.();

        for (let i = 1, connection = top.nextConnection; i < this.count; i++) {
            const block = workspace.newBlock("union:type");
            block.initSvg?.();
            block.previousConnection.connect(connection);
            connection = block.nextConnection;
        }

        return top;
    },
    updateShape(this: UnionBlock, previous = 0) {
        if (previous > this.count) {
            while (previous > this.count) {
                this.removeInput(`TYPE${--previous}`);
            }
        } else if (previous < this.count) {
            while (previous < this.count) {
                this.appendValueInput(`TYPE${previous}`).setCheck("type").appendField(previous++ ? "or" : "any of");
            }
        }
    }
};