/**
 * @license MIT
 * @author Tomáš Wróbel
 * @fileoverview Custom Blockly field for Flag icon
 */
import * as Blockly from 'blockly/core';
import flag from "../../app/flag.svg";

export default class extends Blockly.FieldImage {
    constructor() {
        super(flag, 24, 24, "flag");
    }

    static fromJson() {
        return new this();
    }
}