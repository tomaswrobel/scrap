/**
 * This file is a part of Scrap Native, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomaswrobel/scrap.
 *
 * @license MIT
 * @fileoverview Re-exports the FieldAngle from Blockly.
 * @copyright Tomáš Wróbel 2024
 *
 * Since Blockly v11, the field angle is a separate module.
 * Moreover, it doesn't get registered in the field registry.
 * This is why this file is here, to name the field.
 */
export {FieldAngle as default} from "@blockly/field-angle";
