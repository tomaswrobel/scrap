import * as Blockly from "blockly/core";

Blockly.registry.register(
    Blockly.registry.Type.CONNECTION_CHECKER,
    "ScrapConnectionChecker",
    class extends Blockly.ConnectionChecker {
        doTypeChecks(a: Blockly.Connection, b: Blockly.Connection) {
            const checkArrayOne = a.getCheck();
            const checkArrayTwo = b.getCheck();
    
            return (
                !checkArrayOne ||
                !checkArrayTwo ||
                checkArrayOne.some(a =>
                    checkArrayTwo.some(
                        b => a === b || /* Color & Strings are compatible */ (a === "Color" && b === "String") || (a === "String" && b === "Color")
                    )
                )
            );
        }
    }
);