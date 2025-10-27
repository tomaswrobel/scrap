/**
 * This file is a part of Scrap, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomas-wrobel/scrap.
 *
 * @license MIT [from-monaco-editor]
 * @copyright Microsoft Corporation 2025
 * @fileoverview Just remapped imports.
 */
import type {worker} from "monaco-editor";
import {initialize} from "@monaco-editor/worker";
import {TypeScriptWorker} from "./TypeScriptWorker";

export function create(ctx: worker.IWorkerContext, createData: TypeScriptWorker.CreateData) {
	return new TypeScriptWorker(ctx, createData);
}

self.onmessage = () => {
	initialize(create);
};
