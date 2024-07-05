/**
 * This file is a part of Scrap, an educational programming language.
 * You should have received a copy of the MIT License, if not, please 
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomas-wrobel/scrap. 
 * 
 * @license Apache-2.0
 * @author Google LLC
 * 
 * @license MIT
 * @author Tomáš Wróbel
 * 
 * From: @blockly/continuous-toolbox@1.0.5
 * To: TypeScript, Scrap modifications
 */
import * as Blockly from "blockly";

export class ConnectionChecker extends Blockly.ConnectionChecker {
    doTypeChecks(a: Blockly.Connection, b: Blockly.Connection): boolean {
        const type1 = a.getCheck();
        const type2 = b.getCheck();

        if (!type1 || !type2) {
            return type1 === type2;
        }

        return type1.some(a => type2.some(b => this.isCompatible(a, b)));
    }

    isCompatible(a: string, b: string) {
        if (a === b || (a === "any" && b !== "Variable" && b !== "type") || (b === "any" && a !== "Variable" && a !== "type")) {
            return true;
        }

        if (a === "Iterable") {
            return b === "Array" || b === "string";
        }

        if (b === "Iterable") {
            return a === "Array" || a === "string";
        }

        if (a === "Color") {
            return b === "string";
        }

        if (b === "Color") {
            return a === "string";
        }

        return false;
    }
}

Blockly.registry.register(
    Blockly.registry.Type.CONNECTION_CHECKER,
    Blockly.registry.DEFAULT,
    ConnectionChecker,
    true
);