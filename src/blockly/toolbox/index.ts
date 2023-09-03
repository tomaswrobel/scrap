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
};
