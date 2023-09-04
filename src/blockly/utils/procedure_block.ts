import {BlockSvg, Block} from "blockly/core";

export function isProcedureBlock(block: Block): block is ProcedureBlock {
	return block.type === "function";
}


export default interface ProcedureBlock extends BlockSvg {
	params: {type: string; name: string}[];
	updateShape(): void;
}
