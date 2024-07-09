/**
 * This file is a part of Scrap, an educational programming language.
 * You should have received a copy of the MIT License, if not, please 
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomas-wrobel/scrap. 
 * 
 * @license MIT
 * @author Tomáš Wróbel
 * @fileoverview Booting the Scrap app.
 */
import "./scss/*.scss";
import {App} from "./app";
import {version} from "../package.json";

if ("serviceWorker" in navigator) {
	window.addEventListener("load", function () {
		navigator.serviceWorker.register(
			new URL("../pwa/sw.ts", import.meta.url),
			{type: "module"}
		);
	});
}

window.MonacoEnvironment = {
	getWorker: () => new Worker(
		new URL(
			"./monaco-editor/ts.worker.ts",
			import.meta.url
		),
		{type: "module"}
	),
};

window.app = new App();
window.app.start(version);

// Enable opening files via PWA
window.launchQueue?.setConsumer(async launchParams => {
	if (launchParams.files.length > 0) {
		const fileHandle = launchParams.files[0];

		if (fileHandle.kind === "file") {
			if (fileHandle.name.endsWith(".scrap")) {
				app.open(version, await fileHandle.getFile());
			} else if (fileHandle.name.endsWith(".sb3")) {
				app.import(await fileHandle.getFile());
			} else {
				window.alert("Unsupported file type");
			}
		}
	}
});