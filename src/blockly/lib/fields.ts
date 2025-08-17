/**
 * This file is a part of Scrap, an app for helping to migrate
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
import type * as Blockly from "blockly/core";
import "@blockly/field-colour-hsv-sliders";

export default import.meta.glob<Blockly.fieldRegistry.RegistrableField>("../fields/*.ts", {
	eager: true,
	import: "default",
});
