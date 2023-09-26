import App from "./app";
import {version, displayName} from "../package.json";

const app = new App();
document.title = `${displayName} v${version}`;

if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
        navigator.serviceWorker.register(
            new URL("../pwa/sw.js", import.meta.url),
            {type: "module"}
        );
    });
}

if (window.launchQueue) {
    function isFile(file: FileSystemHandle): file is FileSystemFileHandle {
        return file.kind === "file";
    }

    window.launchQueue.setConsumer(async launchParams => {
        if (launchParams.files.length > 0) {
            const fileHandle = launchParams.files[0];

            if (isFile(fileHandle)) {
                app.open(await fileHandle.getFile());
            }
        }
    });
}