/**
 * This file is a part of Scrap, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomas-wrobel/scrap.
 *
 * @license MIT
 * @copyright Tomáš Wróbel 2025
 * @fileoverview Scrap's connection checker
 *
 * Scrap is strongly-typed, and has some additional types that Blockly
 * doesn't have. Instead of using `null` for dynamic type, we use `any`.
 *
 * Moreover, thanks to TypeScript, it has some hierarchy
 * of types.
 *
 * We can oversimplify the type definition:
 * ```ts
 * type Iterable = Array | string;
 * type Color = string;
 * ```
 *
 * The type `any` cannot accept types `Variable` and `type`,
 * as they are **not** values, but rather instructions
 * for the connection checker.
 */
import * as Blockly from "blockly/core";

export class ConnectionChecker extends Blockly.ConnectionChecker {
	public override doTypeChecks(a: Blockly.Connection, b: Blockly.Connection): boolean {
		const type1 = a.getCheck();
		const type2 = b.getCheck();

		if (!type1 || !type2) {
			return type1 === type2;
		}

		return type1.some(a => type2.some(b => this.isCompatible(a, b)));
	}

	private isCompatible(a: string, b: string) {
		if (
			a === b ||
			(a === "any" && b !== "Variable" && b !== "type") ||
			(b === "any" && a !== "Variable" && a !== "type")
		) {
			return true;
		}

		if (a === "Iterable") {
			return b === "Array" || b === "string";
		}

		if (b === "Iterable") {
			return a === "Array" || a === "string";
		}

		if (a === "Color") {
			return b === "string";
		}

		if (b === "Color") {
			return a === "string";
		}

		return false;
	}
}

Blockly.registry.register(Blockly.registry.Type.CONNECTION_CHECKER, Blockly.registry.DEFAULT, ConnectionChecker, true);
