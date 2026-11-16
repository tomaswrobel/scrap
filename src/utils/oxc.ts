/**
 * This file is a part of Scrap, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomaswrobel/scrap.
 *
 * @license MIT
 * @fileoverview Helpers for the ESTree produced by oxc
 * @copyright Tomáš Wróbel 2025
 */
import {ScrapTypes} from "@scrap/blockly/utils/ScrapTypes";
import type {Check} from "@scrap/types/Check";
import type {MemberExpression, Node, StringLiteral, TSType} from "@oxc-project/types";

type Identifier = Extract<Node, {type: "Identifier"}>;

export function is<K extends Node["type"]>(
	node: unknown,
	type: K,
): node is Extract<Node, {type: K}> {
	if (typeof node !== "object" || !node) {
		return false;
	}

	return "type" in node && node.type === type;
}

export function isString(node: Node): node is StringLiteral {
	return node.type === "Literal" && typeof node.value === "string";
}

/** `a.b` or `a["b"]`, but not `a[b]` */
export function hasSimpleProperty(node: MemberExpression) {
	return node.computed ? isString(node.property) : node.property.type === "Identifier";
}

/** Meant for properties (and keys) which are not computed or are string literals. */
export function getPropertyContents(property: Node) {
	if (property.type === "Identifier") {
		return property.name;
	} else if (isString(property)) {
		return property.value;
	} else {
		return "";
	}
}

/** `TSNumberKeyword` → `number`, `undefined` for other than keyword types */
export function getKeyword(type: Node) {
	return /^TS(\w+)Keyword$/.exec(type.type)?.[1].toLowerCase();
}

export function getType(type: TSType | null | undefined): Check {
	if (type) {
		switch (type.type) {
			case "TSArrayType":
				return "Array";
			case "TSTypeReference": {
				if (
					type.typeName.type === "Identifier" &&
					ScrapTypes.includes(type.typeName.name)
				) {
					return type.typeName.name;
				} else {
					return "any";
				}
			}
			case "TSUnionType": {
				return type.types.reduce(
					(previous, current) => previous.concat(getType(current)),
					new Array<string>(),
				);
			}
			default:
				return getKeyword(type) ?? "any";
		}
	}
	return "any";
}

export function isProperty(node: MemberExpression, ...properties: unknown[]) {
	return hasSimpleProperty(node) && properties.includes(getPropertyContents(node.property));
}

export function isIdentifier(node: Node, ...names: unknown[]): node is Identifier {
	return node.type === "Identifier" && names.includes(node.name);
}

export type * from "@oxc-project/types";
export {parse, transform, getVariables} from "@scrap/compiler/pkg";
