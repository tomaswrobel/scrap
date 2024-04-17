import * as Blockly from "blockly";

export const MIXIN = {
    init(this: Blockly.Block) {
        this.setOutput(true, ["number", "Variable"]);
        this.setStyle("Sensing");
        if (this.workspace instanceof Blockly.WorkspaceSvg) {
            this.appendDummyInput()
                .appendField<string>(
                    new Blockly.FieldDropdown(() => {
                        const result: [string, string][] = [
                            ["volume", "volume"],
                            [
                                "color effect",
                                "effects.color"
                            ],
                            [
                                "ghost effect",
                                "effects.ghost"
                            ],
                            [
                                "grayscale effect",
                                "effects.grayscale"
                            ],
                            [
                                "brightness effect",
                                "effects.brightness"
                            ]
                        ];

                        const sprite = app.entities.find(e => e.name === this.getFieldValue("SPRITE"));

                        if (!sprite) {
                            return result;
                        }

                        if (sprite.name !== "Stage") {
                            result.unshift(
                                ["x", "x"],
                                ["y", "y"],
                                ["size", "size"],
                                [
                                    "direction",
                                    "direction"
                                ],
                                [
                                    "pen size",
                                    "penSize"
                                ],
                                [
                                    "pen color",
                                    "penColor"
                                ],
                                [
                                    "visible",
                                    "visible"
                                ],
                                [
                                    "draggable",
                                    "draggable"
                                ],
                                [
                                    "costume name",
                                    "costume.name"
                                ],
                                [
                                    "costume index",
                                    "costume.index"
                                ]
                            );
                        }

                        for (const [name] of sprite.variables) {
                            result.push([name, `variables[${JSON.stringify(name)}]`]);
                        }

                        return result;
                    }, (value) => {
                        if (value === "draggable" || value === "visible") {
                            this.setOutput(true, ["boolean", "Variable"]);
                        } else if (value.startsWith("variables")) {
                            const sprite = app.entities.find(e => e.name === this.getFieldValue("SPRITE"))!;
                            const [, type] = sprite.variables.find(v => JSON.stringify(v[0]) === value.slice(10, -1))!;
                            this.setOutput(true, ["Variable"].concat(type));
                        } else {
                            this.setOutput(true, ["number", "Variable"]);
                        }

                        return undefined;
                    }),
                    "PROPERTY"
                )
                .appendField("of")
                .appendField<string>(
                    new Blockly.FieldDropdown(
                        () => app.entities.map<[string, string]>(e => [e.name, e.name]),
                        () => void this.setFieldValue("volume", "PROPERTY"),
                    ),
                    "SPRITE"
                );
        } else {
            this.appendDummyInput()
                .appendField(
                    new Blockly.FieldTextInput(),
                    "PROPERTY"
                )
                .appendField(
                    new Blockly.FieldTextInput(),
                    "SPRITE"
                );
        }
    }
};