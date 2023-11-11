import * as Blockly from "blockly/core";

export default function (this: Blockly.Block) {
    const input = this.getInput("DUMMY")!;
    const menu = new Blockly.FieldDropdown(() => {
        const vars = window.app.current.variables.map<[string, string]>(([e]) => [e, e]);

        if (window.app.current.name !== "Stage") {
            for (const variable of window.app.globalVariables) {
                vars.push([variable, variable]);
            }
        }

        return vars;
    });
    input.appendField(menu, "VAR");
};