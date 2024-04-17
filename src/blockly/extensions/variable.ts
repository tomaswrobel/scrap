import * as Blockly from "blockly";

export default function (this: Blockly.Block) {
    const input = this.getInput("DUMMY")!;
    const menu = new Blockly.FieldDropdown(() => {
        const variables: [string, string][] = [];

        for (const [name] of app.current.variables) {
            variables.push([name, name]);
        }

        if (app.current.name !== "Stage") {
            for (const [name] of app.entities[0].variables) {
                variables.push([name, name]);
            }
        }

        return variables;
    });
    input.appendField<string>(menu, "VAR");
};