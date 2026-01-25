/**
 * This file is a part of Scrap, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomaswrobel/scrap.
 *
 * @license MIT
 * @fileoverview SWC node name map
 * @copyright Tomáš Wróbel 2025
 */
import {ScrapTypes} from "@scrap/blockly/utils/ScrapTypes";
import type {Check} from "@scrap/types/Check";
import type * as SWC from "@swc/types";

export interface NodeNameMap {
	ClassProperty: SWC.ClassProperty;
	PrivateProperty: SWC.PrivateProperty;
	Param: SWC.Param;
	Constructor: SWC.Constructor;
	ClassMethod: SWC.ClassMethod;
	PrivateMethod: SWC.PrivateMethod;
	StaticBlock: SWC.StaticBlock;
	Decorator: SWC.Decorator;
	FunctionDeclaration: SWC.FunctionDeclaration;
	ClassDeclaration: SWC.ClassDeclaration;
	VariableDeclaration: SWC.VariableDeclaration;
	VariableDeclarator: SWC.VariableDeclarator;
	Identifier: SWC.Identifier;
	OptionalChainingExpression: SWC.OptionalChainingExpression;
	OptionalChainingCall: SWC.OptionalChainingCall;
	ThisExpression: SWC.ThisExpression;
	ArrayExpression: SWC.ArrayExpression;
	ObjectExpression: SWC.ObjectExpression;
	SpreadElement: SWC.SpreadElement;
	UnaryExpression: SWC.UnaryExpression;
	UpdateExpression: SWC.UpdateExpression;
	BinaryExpression: SWC.BinaryExpression;
	FunctionExpression: SWC.FunctionExpression;
	ClassExpression: SWC.ClassExpression;
	AssignmentExpression: SWC.AssignmentExpression;
	MemberExpression: SWC.MemberExpression;
	SuperPropExpression: SWC.SuperPropExpression;
	ConditionalExpression: SWC.ConditionalExpression;
	Super: SWC.Super;
	Import: SWC.Import;
	CallExpression: SWC.CallExpression;
	NewExpression: SWC.NewExpression;
	SequenceExpression: SWC.SequenceExpression;
	ArrowFunctionExpression: SWC.ArrowFunctionExpression;
	YieldExpression: SWC.YieldExpression;
	MetaProperty: SWC.MetaProperty;
	AwaitExpression: SWC.AwaitExpression;
	TemplateLiteral: SWC.TemplateLiteral;
	TaggedTemplateExpression: SWC.TaggedTemplateExpression;
	TemplateElement: SWC.TemplateElement;
	ParenthesisExpression: SWC.ParenthesisExpression;
	PrivateName: SWC.PrivateName;
	JSXMemberExpression: SWC.JSXMemberExpression;
	JSXNamespacedName: SWC.JSXNamespacedName;
	JSXEmptyExpression: SWC.JSXEmptyExpression;
	JSXExpressionContainer: SWC.JSXExpressionContainer;
	JSXSpreadChild: SWC.JSXSpreadChild;
	JSXOpeningElement: SWC.JSXOpeningElement;
	JSXClosingElement: SWC.JSXClosingElement;
	JSXAttribute: SWC.JSXAttribute;
	JSXText: SWC.JSXText;
	JSXElement: SWC.JSXElement;
	JSXFragment: SWC.JSXFragment;
	JSXOpeningFragment: SWC.JSXOpeningFragment;
	JSXClosingFragment: SWC.JSXClosingFragment;
	StringLiteral: SWC.StringLiteral;
	BooleanLiteral: SWC.BooleanLiteral;
	NullLiteral: SWC.NullLiteral;
	RegExpLiteral: SWC.RegExpLiteral;
	NumericLiteral: SWC.NumericLiteral;
	BigIntLiteral: SWC.BigIntLiteral;
	ExportDefaultExpression: SWC.ExportDefaultExpression;
	ExportDeclaration: SWC.ExportDeclaration;
	ImportDeclaration: SWC.ImportDeclaration;
	ExportAllDeclaration: SWC.ExportAllDeclaration;
	ExportNamedDeclaration: SWC.ExportNamedDeclaration;
	ExportDefaultDeclaration: SWC.ExportDefaultDeclaration;
	ImportDefaultSpecifier: SWC.ImportDefaultSpecifier;
	ImportNamespaceSpecifier: SWC.ImportNamespaceSpecifier;
	NamedImportSpecifier: SWC.NamedImportSpecifier;
	ExportNamespaceSpecifier: SWC.ExportNamespaceSpecifier;
	ExportDefaultSpecifier: SWC.ExportDefaultSpecifier;
	NamedExportSpecifier: SWC.NamedExportSpecifier;
	Module: SWC.Module;
	Script: SWC.Script;
	ArrayPattern: SWC.ArrayPattern;
	ObjectPattern: SWC.ObjectPattern;
	AssignmentPattern: SWC.AssignmentPattern;
	RestElement: SWC.RestElement;
	KeyValuePatternProperty: SWC.KeyValuePatternProperty;
	AssignmentPatternProperty: SWC.AssignmentPatternProperty;
	KeyValueProperty: SWC.KeyValueProperty;
	AssignmentProperty: SWC.AssignmentProperty;
	GetterProperty: SWC.GetterProperty;
	SetterProperty: SWC.SetterProperty;
	MethodProperty: SWC.MethodProperty;
	Computed: SWC.ComputedPropName;
	BlockStatement: SWC.BlockStatement;
	ExpressionStatement: SWC.ExpressionStatement;
	EmptyStatement: SWC.EmptyStatement;
	DebuggerStatement: SWC.DebuggerStatement;
	WithStatement: SWC.WithStatement;
	ReturnStatement: SWC.ReturnStatement;
	LabeledStatement: SWC.LabeledStatement;
	BreakStatement: SWC.BreakStatement;
	ContinueStatement: SWC.ContinueStatement;
	IfStatement: SWC.IfStatement;
	SwitchStatement: SWC.SwitchStatement;
	ThrowStatement: SWC.ThrowStatement;
	TryStatement: SWC.TryStatement;
	WhileStatement: SWC.WhileStatement;
	DoWhileStatement: SWC.DoWhileStatement;
	ForStatement: SWC.ForStatement;
	ForInStatement: SWC.ForInStatement;
	ForOfStatement: SWC.ForOfStatement;
	SwitchCase: SWC.SwitchCase;
	CatchClause: SWC.CatchClause;
	TsTypeAnnotation: SWC.TsTypeAnnotation;
	TsTypeParameterDeclaration: SWC.TsTypeParameterDeclaration;
	TsTypeParameter: SWC.TsTypeParameter;
	TsTypeParameterInstantiation: SWC.TsTypeParameterInstantiation;
	TsParameterProperty: SWC.TsParameterProperty;
	TsQualifiedName: SWC.TsQualifiedName;
	TsCallSignatureDeclaration: SWC.TsCallSignatureDeclaration;
	TsConstructSignatureDeclaration: SWC.TsConstructSignatureDeclaration;
	TsPropertySignature: SWC.TsPropertySignature;
	TsGetterSignature: SWC.TsGetterSignature;
	TsSetterSignature: SWC.TsSetterSignature;
	TsMethodSignature: SWC.TsMethodSignature;
	TsIndexSignature: SWC.TsIndexSignature;
	TsKeywordType: SWC.TsKeywordType;
	TsThisType: SWC.TsThisType;
	TsFunctionType: SWC.TsFunctionType;
	TsConstructorType: SWC.TsConstructorType;
	TsTypeReference: SWC.TsTypeReference;
	TsTypePredicate: SWC.TsTypePredicate;
	TsImportType: SWC.TsImportType;
	TsTypeQuery: SWC.TsTypeQuery;
	TsTypeLiteral: SWC.TsTypeLiteral;
	TsArrayType: SWC.TsArrayType;
	TsTupleType: SWC.TsTupleType;
	TsTupleElement: SWC.TsTupleElement;
	TsOptionalType: SWC.TsOptionalType;
	TsRestType: SWC.TsRestType;
	TsUnionType: SWC.TsUnionType;
	TsIntersectionType: SWC.TsIntersectionType;
	TsConditionalType: SWC.TsConditionalType;
	TsInferType: SWC.TsInferType;
	TsParenthesizedType: SWC.TsParenthesizedType;
	TsTypeOperator: SWC.TsTypeOperator;
	TsIndexedAccessType: SWC.TsIndexedAccessType;
	TsMappedType: SWC.TsMappedType;
	TsLiteralType: SWC.TsLiteralType;
	TsTemplateLiteralType: SWC.TsTemplateLiteralType;
	TsInterfaceDeclaration: SWC.TsInterfaceDeclaration;
	TsInterfaceBody: SWC.TsInterfaceBody;
	TsExpressionWithTypeArguments: SWC.TsExpressionWithTypeArguments;
	TsTypeAliasDeclaration: SWC.TsTypeAliasDeclaration;
	TsEnumDeclaration: SWC.TsEnumDeclaration;
	TsEnumMember: SWC.TsEnumMember;
	TsModuleDeclaration: SWC.TsModuleDeclaration;
	TsModuleBlock: SWC.TsModuleBlock;
	TsNamespaceDeclaration: SWC.TsNamespaceDeclaration;
	TsImportEqualsDeclaration: SWC.TsImportEqualsDeclaration;
	TsExternalModuleReference: SWC.TsExternalModuleReference;
	TsExportAssignment: SWC.TsExportAssignment;
	TsNamespaceExportDeclaration: SWC.TsNamespaceExportDeclaration;
	TsAsExpression: SWC.TsAsExpression;
	TsSatisfiesExpression: SWC.TsSatisfiesExpression;
	TsInstantiation: SWC.TsInstantiation;
	TsTypeAssertion: SWC.TsTypeAssertion;
	TsConstAssertion: SWC.TsConstAssertion;
	TsNonNullExpression: SWC.TsNonNullExpression;
	Invalid: SWC.Invalid;
}

export type Node = NodeNameMap[keyof NodeNameMap];

export function is<K extends keyof NodeNameMap>(
	node: unknown,
	type: K,
): node is NodeNameMap[K] {
	if (typeof node !== "object" || !node) {
		return false;
	}

	return "type" in node && node.type === type;
}

export function hasType<N extends SWC.Node>(node: N): node is N & WithTypeAnnotation {
	return "typeAnnotation" in node && is(node.typeAnnotation, "TsTypeAnnotation");
}

export interface WithTypeAnnotation {
	typeAnnotation: SWC.TsTypeAnnotation;
}

export interface TypedIdentifier extends SWC.Identifier {
	typeAnnotation: SWC.TsTypeAnnotation;
}

export function hasSimpleProperty(node: SWC.MemberExpression) {
	return (
		is(node.property, "Identifier") ||
		(is(node.property, "Computed") && is(node.property.expression, "StringLiteral"))
	);
}

export function getPropertyContents(property: Node) {
	if (is(property, "Identifier") || is(property, "StringLiteral")) {
		return property.value;
	} else if (is(property, "Computed")) {
		return property.expression.type === "StringLiteral" ? property.expression.value : "";
	} else {
		return "";
	}
}

export function getType(type: SWC.TsType | null | undefined): Check {
	if (type) {
		switch (type.type) {
			case "TsArrayType":
				return "Array";
			case "TsKeywordType":
				return type.kind;
			case "TsTypeReference": {
				if (
					type.typeName.type === "Identifier" &&
					ScrapTypes.includes(type.typeName.value)
				) {
					return type.typeName.value;
				} else {
					return "any";
				}
			}
			case "TsUnionType": {
				return type.types.reduce(
					(previous, current) => previous.concat(getType(current)),
					new Array<string>(),
				);
			}
		}
	}
	return "any";
}

export function isProperty(node: SWC.MemberExpression, ...properties: unknown[]) {
	if (isIdentifier(node.property, ...properties)) {
		return true;
	}
	if (is(node.property, "Computed") && is(node.property.expression, "StringLiteral")) {
		return properties.includes(node.property.expression.value);
	}
	return false;
}

export function isIdentifier(node: Node, ...names: unknown[]): node is SWC.Identifier {
	return is(node, "Identifier") && names.includes(node.value);
}

export type * from "@swc/types";
export {parse, transform, getVariables} from "@scrap/compiler/pkg";
