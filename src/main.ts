import {App} from "./app";
import {version} from "../package.json";

if ("serviceWorker" in navigator) {
	window.addEventListener("load", function () {
		navigator.serviceWorker.register(
			new URL("../pwa/sw.js", import.meta.url),
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

// Enable opening files via PWA
window.launchQueue?.setConsumer(async launchParams => {
	function isFile(file: FileSystemHandle): file is FileSystemFileHandle {
		return file.kind === "file";
	}

	if (launchParams.files.length > 0) {
		const fileHandle = launchParams.files[0];

		if (isFile(fileHandle)) {
			if (fileHandle.name.endsWith(".sb3")) {
				app.open(version, await fileHandle.getFile());
			} else if (fileHandle.name.endsWith(".scrap")) {
				app.import(await fileHandle.getFile());
			} else {
				window.alert("Unsupported file type");
			}
		}
	}
});

window.app = new App();
window.app.start(version);