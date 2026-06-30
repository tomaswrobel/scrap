/**
 * This file is a part of Scrap, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomaswrobel/scrap.
 *
 * @license MIT
 * @fileoverview A decorator to syntatically simplify registration of fields.
 * @copyright Tomáš Wróbel 2025
 */
import * as Blockly from "blockly/core";

export function registerField(name: string) {
	return function <Class extends Blockly.fieldRegistry.RegistrableField>(target: Class) {
		Blockly.fieldRegistry.register(name, target);
	};
}
