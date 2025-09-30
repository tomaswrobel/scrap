import type {Check} from "@scrap/types/Check";
import type * as Blockly from "blockly";

export interface Entity {
	code: Blockly.serialization.blocks.State | string;
	variables: [name: string, type: Check][];
	isStage: boolean;
	name: string;
}

export const entity = $state({});
