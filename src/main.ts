/**
 * This file is a part of Scrap Native, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomaswrobel/scrap.
 *
 * @license MIT
 * @copyright Tomáš Wróbel 2024
 * @fileoverview Booting the Scrap app.
 */
import "./scss/*.scss";
import App from "./app";

window.MonacoEnvironment = {
	getWorker: () =>
		new Worker(new URL("./monaco-editor/ts.worker.ts", import.meta.url), {
			type: "module",
		}),
};

window.app = new App();
window.app.start();
