/**
 * This file is a part of Scrap Native, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomas-wrobel/scrap.
 *
 * @license MIT [from-monaco-editor]
 * @author Microsoft Corporation
 * @fileoverview Just remapped imports.
 */
import {initialize} from "monaco-editor/esm/vs/editor/editor.worker";
import {TypeScriptWorker, create} from "./tsWorker";
import ts from "typescript";

self.onmessage = () => {
	// ignore the first message
	initialize(create);
};

export {TypeScriptWorker, create, initialize, ts};
