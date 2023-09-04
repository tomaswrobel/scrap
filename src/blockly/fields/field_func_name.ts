import ProcedureEvent from "../events/procedure";
import * as Blockly from "blockly/core";

class FieldFuncName extends Blockly.FieldTextInput {
    doValueUpdate_(value: any): void {
        super.doValueUpdate_(value);
        this.sourceBlock_?.workspace.fireChangeListener(
            new ProcedureEvent(this.sourceBlock_!.getFieldValue("NAME"), this.sourceBlock_!.saveExtraState!())
        );
    }

    static fromJson(options: Blockly.FieldTextInputFromJsonConfig): Blockly.FieldTextInput {
        return new FieldFuncName(options["text"], undefined, {
            spellcheck: options["spellcheck"],
            tooltip: options["tooltip"]
        });
    }
}

export default FieldFuncName;