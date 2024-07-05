/**
 * This file is a part of Scrap, an educational programming language.
 * You should have received a copy of the MIT License, if not, please 
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomas-wrobel/scrap. 
 * 
 * @license MIT
 * @fileoverview Typings for the glob import
 * @author Tomáš Wróbel
 */
import * as Blockly from "blockly";

declare const fields: {
    [name: string]: {
        default: Blockly.fieldRegistry.RegistrableField;
    };
};

export = fields;