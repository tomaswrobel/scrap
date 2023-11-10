import App from "./app";
import "parley.js/dist/default.css";
import {version, displayName} from "../package.json";

window.app = new App();
window.app.start();
document.title = `${displayName} v${version}`;

if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
        navigator.serviceWorker.register(
            new URL("../pwa/sw.js", import.meta.url),
            {type: "module"}
        );
    });
}

if ("launchQueue" in window) {
    function isFile(file: FileSystemHandle): file is FileSystemFileHandle {
        return file.kind === "file";
    }

    window.launchQueue!.setConsumer(async launchParams => {
        if (launchParams.files.length > 0) {
            const fileHandle = launchParams.files[0];

            if (isFile(fileHandle)) {
                window.app.open(await fileHandle.getFile());
            }
        }
    });
}