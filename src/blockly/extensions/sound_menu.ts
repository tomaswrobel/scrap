import * as Blockly from "blockly/core";

export default function (this: Blockly.Block) {
    const input = this.getInput("DUMMY")!;
    const menu = new Blockly.FieldDropdown(() => {
        if (!window.app.current.sounds.length) {
            return [["", ""]];
        }
        return window.app.current.sounds.map<[string, string]>(e => [e.name, e.name]);
    });
    input.appendField(menu, "NAME");
};