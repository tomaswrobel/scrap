import {Types} from "../utils/types";
import ProcedureEvent from "../events/procedure";
import * as Blockly from "blockly/core";

export default class TypeField extends Blockly.FieldDropdown {
	constructor() {
		super(Types.map(type => [type || "void", type] as [string, string]));
	}

	protected doValueUpdate_(value: string): void {
		super.doValueUpdate_(value);
		this.sourceBlock_?.workspace.fireChangeListener(
			new ProcedureEvent(this.sourceBlock_!.getFieldValue("NAME"), this.sourceBlock_!.saveExtraState!())
		);
	}

    static fromJson() {
        return new TypeField()
    }
}
