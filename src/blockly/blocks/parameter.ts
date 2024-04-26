/**
 * @license MIT
 * @fileoverview Defines the parameter mutator.
 * @author Tomáš Wróbel
 * 
 * This mutator is used to update the type of the parameter block.
 * The parameter block is:
 * - a variable getter
 * - a block created by FieldParam, see fields/field_param.ts
 */
export type ParameterBlock = import("blockly").BlockSvg & ParameterBlockMixin;
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
};