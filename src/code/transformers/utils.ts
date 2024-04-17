import type * as babel from "@babel/core";
import {Types} from "../../blockly";

export const reserved = Object.getOwnPropertyNames(window);
reserved.unshift(
	// ECMAScript
	"break",
	"case",
	"catch",
	"class",
	"const",
	"continue",
	"debugger",
	"default",
	"delete",
	"do",
	"else",
	"export",
	"extends",
	"finally",
	"for",
	"function",
	"if",
	"import",
	"in",
	"instanceof",
	"new",
	"return",
	"super",
	"switch",
	"this",
	"throw",
	"try",
	"typeof",
	"var",
	"void",
	"while",
	"with",
	"yield",
	"enum",
	"implements",
	"interface",
	"let",
	"package",
	"private",
	"protected",
	"public",
	"static",
	"await",
	"null",
	"true",
	"false",
	"arguments",
	// Global objects
	"Scrap",
	"Color",
	"$"
);

// Escaping
//
// Idea taken from:
// https://github.com/smallhelm/to-js-identifier
//
// Which is licensed under the MIT license
// (C) 2016 Small Helm LLC
//
// Of course, I had to modify it a lot.

const bad = /(^[^a-zA-Z_])|([^a-zA-Z_0-9])/g;

function dollar(bad: string) {
	return `$${bad.charCodeAt(0)}$`;
}

export function escape(string: string) {
	const result = string.replace(bad, dollar);

	if (reserved.includes(result)) {
		return `$${result}$`;
	}

	return result;
}

export function identifier(this: import("blockly").FieldTextInput, value: string) {
	return (value && reserved.indexOf(value) === -1 && /[$_\p{ID_Start}][$\u200c\u200d\p{ID_Continue}]*/u.test(value)) ? value : null;
}

export function getPropertyContents(property: babel.types.Identifier | babel.types.StringLiteral): string;
export function getPropertyContents(property: babel.types.Node) {
	if (property.type === "Identifier") {
		return property.name;
	} else if (property.type === "StringLiteral") {
		return property.value;
	} else {
		return false;
	}
}

export function getType(type: babel.types.TSType | null | undefined): string | string[] {
	if (type) switch (type.type) {
		case "TSArrayType": return "Array";
		case "TSBooleanKeyword": return "boolean";
		case "TSNumberKeyword": return "number";
		case "TSStringKeyword": return "string";
		case "TSExpressionWithTypeArguments": {
			if (type.expression.type === "Identifier" && Types.includes(type.expression.name)) {
				return type.expression.name;
			} else {
				return "any";
			}
		}
		case "TSTypeReference": {
			if (type.typeName.type === "Identifier" && Types.includes(type.typeName.name)) {
				return type.typeName.name;
			} else {
				return "any";
			}
		}
		case "TSUnionType": {
			return type.types.reduce((previous, current) => previous.concat(getType(current)), new Array<string>());
		}
	}
	return "any";
}

export function isProperty(node: babel.types.MemberExpression, ...properties: string[]): node is babel.types.MemberExpression & {property: babel.types.Identifier | babel.types.StringLiteral;} {
	return (
		isIdentifier(node.property, ...properties) ||
		(node.property.type === "StringLiteral" && properties.indexOf(node.property.value) > -1)
	);
}

export function isIdentifier(node: babel.types.Node, ...names: string[]) {
	return node.type === "Identifier" && names.indexOf(node.name) > -1;
}