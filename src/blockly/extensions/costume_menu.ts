import * as Blockly from "blockly/core";

export default function (this: Blockly.Block) {
    const input = this.getInput("DUMMY")!;
    const menu = new Blockly.FieldDropdown(() => window.app.current.costumes.map<[string, string]>(e => {
        if (e.name.length > 12) {
            return [e.name.slice(0, 12) + "...", e.name]
        }
        return [e.name, e.name];
    }));
    input.appendField(menu, "NAME");
};