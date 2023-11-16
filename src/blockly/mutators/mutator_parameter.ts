/**
 * @license MIT
 * @fileoverview Defines the parameter mutator (to update the shape).
 * @author Tomáš Wróbel
 */
export type ParameterBlock = import("blockly").BlockSvg & ParameterBlockMixin;
export interface ParameterBlockMixin extends ParameterBlockMixinType {}
export type ParameterBlockMixinType = typeof MIXIN;

export const MIXIN = {
    type_: "" as string | string[] | null,
    isVariable_: false,

    saveExtraState() {
        return {
            type: this.type_,
            isVariable: this.isVariable_,
        };
    },

    loadExtraState(this: ParameterBlock, state: any) {
        this.type_ = state.type;
        this.isVariable_ = state.isVariable;
        this.setOutput(true, this.type_);
    },
};