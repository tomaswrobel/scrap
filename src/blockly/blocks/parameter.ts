/**
 * This file is a part of Scrap, an educational programming language.
 * You should have received a copy of the MIT License, if not, please 
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomas-wrobel/scrap. 
 * 
 * @license MIT
 * @fileoverview Defines the parameter mutator.
 * @author Tomáš Wróbel
 * 
 * This mutator is used to update the type of the parameter block.
 * The parameter block is:
 * - a variable getter
 * - a block created by FieldParam, see fields/field_param.ts
 */
import * as Parley from "parley.js";
import {ContextMenuRegistry, BlockSvg} from "blockly";
export type ParameterBlock = BlockSvg & ParameterBlockMixin;
export interface ParameterBlockMixin extends ParameterBlockMixinType {}
export type ParameterBlockMixinType = typeof MIXIN;

export const MIXIN = {
    type_: "any" as app.Check | null,
    isVariable_: false,
    isConstant_: false,

    saveExtraState() {
        return {
            type: this.type_,
            isVariable: this.isVariable_,
            isConstant: this.isConstant_
        };
    },

    loadExtraState(this: ParameterBlock, state: any) {
        this.type_ = state.type || "any";
        this.isVariable_ = state.isVariable || false;
        this.isConstant_ = state.isConstant || false;

        if (this.isConstant_) {
            this.setOutput(true, this.type_);
        } else {
            const type = this.type_;

            if (!type) {
                this.setOutput(true, ["any", "Variable"]);
            } else if (Array.isArray(type)) {
                this.setOutput(true, [...type, "Variable"]);
            } else {
                this.setOutput(true, [type, "Variable"]);
            }
        }
    },

    customContextMenu(this: ParameterBlock, options: ContextMenuRegistry.LegacyContextMenuOption[]) {
        if (this.isInFlyout && this.isVariable_) {
            options.push({
                text: "Delete variable",
                enabled: true,
                callback: async () => {
                    if (await Parley.fire({
                        input: "none",
                        title: "Delete Variable",
                        body: "Are you sure you want to delete this variable?",
                        cancelButtonHTML: "No",
                        confirmButtonHTML: "Yes"
                    })) {
                        app.current.variables = app.current.variables.filter(
                            ([name]) => name !== this.getFieldValue("VAR")
                        );
                        this.workspace.refreshToolboxSelection();
                    }
                }
            }, {
                text: "Info",
                enabled: true,
                callback: () => {
                    const body = document.createElement("table");
                    const name = this.getFieldValue("VAR");

                    body.innerHTML = `
                        <tr>
                            <td style="text-align:left;">Name:</td>
                            <td>${name}</td>
                        </tr>
                        <tr>
                            <td style="text-align:left;">Type:</td>
                            <td>${([] as string[]).concat(this.type_ || "any").join(" or ")}</td>
                        </tr>
                        <tr>
                            <td style="text-align:left;">Constant:</td>
                            <td>${this.isConstant_ ? "Yes" : "No"}</td>
                        </tr>
                    `;

                    Parley.fire({input: "none", title: "Variable Info", body});
                }
            });
        }
    }
};