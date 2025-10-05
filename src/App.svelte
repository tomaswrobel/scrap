<script lang="ts" module>
	import "./app.css";
	import Dialog from "./components/controls/Dialog.svelte";
	import { app } from "./App.svelte.ts";
</script>

<main class="p-10">
	<h2 class="text-xl font-bold">Context menu</h2>
	<Dialog bind:this={app.dialog} />
</main>
