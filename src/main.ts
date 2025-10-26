import {createFrameworkRoot} from "./utils/createFrameworkRoot";
import {mount} from "svelte";
import App from "./App.svelte";
const app = mount(App, {
	target: createFrameworkRoot(),
});

export default app;
