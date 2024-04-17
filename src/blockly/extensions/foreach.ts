import type * as Blockly from "blockly";
import * as Parley from "parley.js";

export default function (this: Blockly.BlockSvg) {
    this.customContextMenu = function (options) {
        options.push({
            text: "Rename variable...",
            callback: () => {
                Parley.fire({
                    input: "text",
                    title: "Rename Variable",
                    body: "New name:",
                    value: this.getFieldValue("VAR"),
                }).then(name => {
                    if (name === false) {
                        return;
                    }
                    this.setFieldValue(name, "VAR");
                });
            },
            enabled: true,
        });
    };
};