import {BlockSvg} from "blockly/core";

export default interface ProcedureBlock extends BlockSvg {
	params: {type: string; name: string}[];
	isGenerator: boolean;
	updateShape(): void;
}
