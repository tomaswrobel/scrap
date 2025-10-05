import {mount} from "svelte";
import App from "./App.svelte";
import "./app.css";

const app = mount(App, {
	target: document.body.appendChild(document.createElement("div")),
});

export default app;
