import App from "./app";
import {version, displayName} from "../package.json";

new App();
document.title = `${displayName} v${version}`;