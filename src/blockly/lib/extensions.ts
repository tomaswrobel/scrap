/**
 * This file is a part of Scrap Native, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomaswrobel/scrap.
 *
 * @license MIT
 * @fileoverview Typings for the glob import
 * @copyright Tomáš Wróbel 2025
 */
import type * as Blockly from "blockly";

/** The extensions modules. */
type extensions = {
	[name: string]: {
		default: (this: Blockly.Block) => void;
	};
};

export default require("../extensions/*.ts") as extensions;
