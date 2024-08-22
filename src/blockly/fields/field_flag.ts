/**
 * This file is a part of Scrap, an educational programming language.
 * You should have received a copy of the MIT License, if not, please 
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomas-wrobel/scrap. 
 * 
 * @license MIT
 * @fileoverview Scratch-like flag icon.
 * @author Tomáš Wróbel
 */
import * as Blockly from 'blockly/core';
import fs from "fs";

const data = fs.readFileSync("src/svgs/flag.svg", "base64");

export default class extends Blockly.FieldImage {
    constructor() {
        super(`data:image/svg+xml;base64,${data}`, 24, 24, "flag");
    }

    static fromJson() {
        return new this();
    }
}