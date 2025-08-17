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
 * @fileoverview Booting the Scrap app.
 */
import "@fontsource/geist";
import "./scss/app.scss";
import "./scss/base.scss";
import "./scss/dialog.scss";
import "./scss/slider.scss";
import App from "./app";

window.MonacoEnvironment = {
	getWorker: () =>
		new Worker(new URL("./monaco-editor/ts.worker.ts", import.meta.url), {
			type: "module",
		}),
};

window.app = new App();
window.app.start();
