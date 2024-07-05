/**
 * This file is a part of Scrap, an educational programming language.
 * You should have received a copy of the MIT License, if not, please 
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomas-wrobel/scrap. 
 * 
 * @license MIT
 * @fileoverview Plugins export file.
 * @author Tomáš Wróbel
 */
import * as Blockly from "blockly";
import {Category} from "./category";
import {Metrics} from "./metrics";
import {Toolbox} from "./toolbox";
import {Flyout} from "./flyout";
import {ConnectionChecker} from "./connection-checker";
import {Renderer} from "./renderer";
import "./block-image";

Blockly.blockRendering.register("scrap", Renderer);
Blockly.registry.register(Blockly.registry.Type.TOOLBOX_ITEM, "category", Category, true);

export default {
	toolbox: Toolbox,
	flyoutsVerticalToolbox: Flyout,
	metricsManager: Metrics,
	connectionChecker: ConnectionChecker
};
