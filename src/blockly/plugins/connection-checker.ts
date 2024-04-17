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