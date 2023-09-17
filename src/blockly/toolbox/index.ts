/**
 * @license MIT
 * @fileoverview Plugins export file.
 * @author Tomáš Wróbel
 */
import * as Blockly from "blockly/core";
import Category from "./category";
import {Metrics} from "./metrics";
import {Toolbox} from "./toolbox";
import {Flyout} from "./flyout";

Blockly.registry.register(Blockly.registry.Type.METRICS_MANAGER, "CustomMetricsManager", Metrics);
Blockly.registry.register(Blockly.registry.Type.TOOLBOX_ITEM, "category", Category, true);

export default {
	toolbox: Toolbox,
	flyoutsVerticalToolbox: Flyout,
	metricsManager: Metrics,
	connectionChecker: class extends Blockly.ConnectionChecker {
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
};
