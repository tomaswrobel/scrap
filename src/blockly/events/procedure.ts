import {Events} from "blockly/core";

export default class ProcedureEvent extends Events.Abstract {
	isBlank = true;
	type = "procedure";

	constructor(readonly name: string, readonly extra: any) {
		super();
	}
}
