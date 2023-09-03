import * as Blockly from 'blockly/core';

export default class FieldHex extends Blockly.FieldTextInput {
    static fromJson(options: any) {
        return new FieldHex(options['value']);
    }

    constructor(value = 'ff0000') {
        super(
            value,
            (input: string) => {
                const color = this.validate(input);
                if (color) {
                    this.sourceBlock_!.setColour(color);
                }
                return color;
            }
        );
    }

    validate(input: string) {
        if (input.startsWith('#')) {
            input = input.slice(1);
        }
        if (input.match(/^[0-9a-f]{3}$/i)) {
            return input[0] + input[0] + input[1] + input[1] + input[2] + input[2];
        }
        if (!(input.match(/^[0-9a-f]{6}$/i))) {
            return null;
        }
        return input.toLowerCase();
    }
}