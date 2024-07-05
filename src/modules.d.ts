/**
 * This file is a part of Scrap, an educational programming language.
 * You should have received a copy of the MIT License, if not, please 
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomas-wrobel/scrap. 
 * 
 * @license MIT
 * @author Tomáš Wróbel
 * @fileoverview Global types for Scrap.
 */

/**
 * Scrap app instance.
 * It is not moduled because:
 * - it is a singleton
 * - it is used everywhere
 * - it should be available in devtools
 */
declare var app: import("./app").App;

declare module app {
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
}

declare module "*.svg" {
    const url: string;
    export default url;
}

/*
 * I don't understand why Microsoft doesn't
 * ship this with the monaco-editor package.
 */
declare module "monaco-editor/worker" {
    import {worker} from "monaco-editor";

    export interface InitializeCallback<Data = any> {
        (ctx: worker.IWorkerContext, createData: Data): void;
    }

    export function initialize(fn: InitializeCallback): void;
}

declare module "@babel/preset-typescript";