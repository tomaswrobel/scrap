import type * as babel from "@babel/core"; 

export const reserved = Object.getOwnPropertyNames(window);
reserved.unshift(
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
	"Scrap",
	"Color",
);

/**
 * Checks if the given path is in scope,
 * meaning that it is not a parameter of a function,
 * a variable in a for...of loop or a variable in a try...catch block.
 * @param path Babel path
 * @returns 
 */
export function checkForScope(path: babel.NodePath<babel.types.Identifier>) {
    // Check if there is no function with the parameter
    let parent = path.parentPath;
    while (parent && parent.node.type !== "FunctionDeclaration" && parent.node.type !== "FunctionExpression") {
        parent = parent.parentPath!;
    }
    if (parent && parent.node.type === "FunctionDeclaration") {
        if (parent.node.params.some((param) => param.type === "Identifier" && param.name === path.node.name)) {
            return true;
        }
    }

    // Check for for...of loops
    parent = path.parentPath;
    while (parent && parent.node.type !== "ForOfStatement") {
        parent = parent.parentPath!;
    }
    if (parent && parent.node.type === "ForOfStatement") {
        if (parent.node.left.type === "Identifier" && parent.node.left.name === path.node.name) {
            return true;
        }
    }

    // Check for try...catch blocks
    parent = path.parentPath;
    while (parent && parent.node.type !== "TryStatement") {
        parent = parent.parentPath!;
    }

    if (parent && parent.node.type === "TryStatement") {
        if (parent.node.handler && parent.node.handler.param && parent.node.handler.param.type === "Identifier" && parent.node.handler.param.name === path.node.name) {
            return true;
        }
    }

    return false;
}

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

// Unescaping
// I did this one myself. (It is not that hard though)

export function unescape(string: string) {
    const result = string.replace(/\$(\d+)\$/g, (_, code) => String.fromCharCode(Number(code)));

    if (result[0] === "$" && result[result.length - 1] === "$" && result.length > 1) {
        return result.slice(1, -1);
    }

    return result;
}