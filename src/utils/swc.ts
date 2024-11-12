/**
 * This file is a part of Scrap Native, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomas-wrobel/scrap.
 *
 * @license MIT
 * @fileoverview SWC utilities
 * @copyright Tomáš Wróbel 2024
 */
import {invoke} from "@tauri-apps/api/core";
import type * as Types from "@swc/types";
import {Types as types} from "@scrap/blockly";
import type SWCNodeNameMap from "./swc_nodes";

export function parse(code: string) {
	return invoke<Types.Module>("parse", {code});
}

export function transform(code: string) {
	return invoke<string>("transform", {code});
}

export function getVariables(code: string) {
	return invoke<Variable[]>("variables", {code});
}

export function is<K extends keyof SWCNodeNameMap>(
	node: any,
	type: K
): node is SWCNodeNameMap[K] {
	return node.type === type;
}

export interface WithTypeAnnotation {
	typeAnnotation: Types.TsTypeAnnotation;
}

export function hasType<N extends Types.Node>(
	node: N
): node is N & WithTypeAnnotation {
	return (
		"typeAnnotation" in node && is(node.typeAnnotation, "TsTypeAnnotation")
	);
}

export interface TypedIdentifier extends Types.Identifier {
	typeAnnotation: Types.TsTypeAnnotation;
}

export function hasSimpleProperty(node: Types.MemberExpression) {
	return (
		is(node.property, "Identifier") ||
		(is(node.property, "Computed") &&
			is(node.property.expression, "StringLiteral"))
	);
}

export function getPropertyContents(property: Node) {
	if (is(property, "Identifier") || is(property, "StringLiteral")) {
		return property.value;
	} else if (is(property, "Computed")) {
		return property.expression.type === "StringLiteral"
			? property.expression.value
			: "";
	} else {
		return "";
	}
}

export function getType(type: Types.TsType | null | undefined): Check {
	if (type)
		switch (type.type) {
			case "TsArrayType":
				return "Array";
			case "TsKeywordType":
				return type.kind;
			case "TsTypeReference": {
				if (
					type.typeName.type === "Identifier" &&
					types.includes(type.typeName.value)
				) {
					return type.typeName.value;
				} else {
					return "any";
				}
			}
			case "TsUnionType": {
				return type.types.reduce(
					(previous, current) => previous.concat(getType(current)),
					new Array<string>()
				);
			}
		}
	return "any";
}

export function isProperty(
	node: Types.MemberExpression,
	...properties: unknown[]
) {
	if (isIdentifier(node.property, ...properties)) {
		return true;
	}
	if (
		is(node.property, "Computed") &&
		is(node.property.expression, "StringLiteral")
	) {
		return properties.indexOf(node.property.expression.value) > -1;
	}
	return false;
}

export function isIdentifier(
	node: Node,
	...names: unknown[]
): node is Types.Identifier {
	return is(node, "Identifier") && names.indexOf(node.value) > -1;
}

export type Node = SWCNodeNameMap[keyof SWCNodeNameMap];
export type * from "@swc/types";
