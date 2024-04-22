import type * as Blockly from "blockly";
import * as Parley from "parley.js";
import {reserved} from "../../code/transformers/utils";

export default function (this: Blockly.BlockSvg) {
    this.customContextMenu = function (options) {
        const [value, type = "any"] = this.getFieldValue("VAR").split(":");
        options.push({
            text: "Rename variable...",
            callback: async () => {
                const name = await Parley.fire({
                    input: "text",
                    title: "Rename Variable",
                    body: "New name:",
                    value,
                    inputOptions: {
                        pattern: /^[a-zA-Z_$][\w$]*$/
                    }
                });

                if (name === false) {
                    return;
                }

                if (reserved.includes(name)) {
                    Parley.fire({
                        title: "Invalid Name",
                        body: "This name is reserved by JavaScript.",
                        input: "none",
                    });
                    return;
                }

                this.setFieldValue(`${name}:${type}`, "VAR");
            },
            enabled: true,
        });
    };
};