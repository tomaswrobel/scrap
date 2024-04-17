import * as Blockly from "blockly";
import {TypeToShadow} from "../types";

export default function (this: Blockly.BlockSvg) {
    this.onchange = function (event: Blockly.Events.Abstract) {
        if (event instanceof Blockly.Events.BlockMove && event.newParentId === this.id && this.workspace instanceof Blockly.WorkspaceSvg) {
            const input = this.getInput("VAR")!;
            const block = input.connection!.targetBlock()!;
            const value = this.getInput("VALUE")!;

            let check = block.outputConnection?.getCheck()?.filter((c: string) => c !== "Variable");
            let type = "any";

            if (check?.length === 1) {
                type = check[0];
            }

            if (type in TypeToShadow) {
                const thisBlock = value.connection!.targetBlock();

                if (thisBlock && thisBlock.isShadow() && thisBlock.type !== TypeToShadow[type]) {
                    value.connection!.setShadowState({
                        type: TypeToShadow[type]
                    });
                }
            }
        }
    };
}