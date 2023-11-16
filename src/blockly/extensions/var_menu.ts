import * as Blockly from "blockly/core";

function nameOf([name]: [string, string]) {
    return [name, name] as [string, string];
}

export default function (this: Blockly.Block) {
    const input = this.getInput("DUMMY")!;
    const menu = new Blockly.FieldDropdown(() => [
        ...window.app.current.variables.map(nameOf),
        ...window.app.current.name === "Stage" ? [] : window.app.globalVariables.map(nameOf)
    ]);
    input.appendField(menu, "VAR");
};