/**
 * This file is a part of Scrap, an educational programming language.
 * You should have received a copy of the MIT License, if not, please 
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomas-wrobel/scrap. 
 * 
 * @license MIT
 * @author Tomáš Wróbel
 * @fileoverview Custom Blockly field for valid JS identifier.
 */
import * as Blockly from 'blockly/core';
import {reserved} from '../../code/transformers/utils';

export default class FieldIdentifier extends Blockly.FieldTextInput {
    onFinish?: (result: string) => void;

    static fromJson(options: any) {
        return new FieldIdentifier(options['value']);
    }

    doClassValidation_(value: string) {
        const banned = [...reserved];

        if (this.sourceBlock_?.type.startsWith("function")) {
            for (const block of this.sourceBlock_.workspace.getBlocksByType(this.sourceBlock_.type)) {
                if (block !== this.sourceBlock_) {
                    banned.push(block.getFieldValue("NAME")!);
                }
            }
        }

        if (value) {
            const name = value.replace(/ /g, "_");
            for (var i = 0; banned.includes(`${name}${i || ""}`); i++);
            if (/[$_\p{ID_Start}][$\u200c\u200d\p{ID_Continue}]*/u.test(`${name}${i || ""}`)) {
                return `${name}${i || ""}`;
            }
        }
        return null;
    }

    onFinishEditing_(value: string) {
        super.onFinishEditing_(value);
        this.onFinish?.(value);
    }

    protected spellcheck_ = false;
}