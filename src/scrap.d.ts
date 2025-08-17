/**
 * This file is a part of Scrap, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomaswrobel/scrap.
 *
 * @license MIT
 * @copyright Tomáš Wróbel 2025
 * @fileoverview Global types for Scrap.
 */

/**
 * Variable type.
 * Either a string or an array of strings (union type).
 */
type Check = string | string[];

/**
 * Variable tuple.
 * A tuple of a variable name and its type.
 */
type Variable = [name: string, type: Check];

/**
 * Rectangular type.
 * A record of x, y, width and height.
 */
type Rectangular = Record<"x" | "y" | "width" | "height", number>;

/**
 * Scrap app instance.
 * It is not moduled because:
 * - it is a singleton
 * - it is used everywhere
 * - it should be available in devtools
 */
declare var app: import("./app").default;

/*
 * I don't understand why Microsoft doesn't
 * ship this with the monaco-editor package.
 */
declare module "monaco-editor/esm/vs/editor/editor.worker" {
	import type {worker} from "monaco-editor";

	export interface InitializeCallback<Data> {
		(ctx: worker.IWorkerContext, createData: Data): void;
	}

	export function initialize<Data>(fn: InitializeCallback<Data>): void;
}

declare module "monaco-editor/*";
