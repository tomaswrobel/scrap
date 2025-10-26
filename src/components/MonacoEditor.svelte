<script lang="ts" module>
	import Worker from "@scrap/monaco-editor/ts.worker.ts?worker";
	import {editor, Uri} from "monaco-editor";
	import lib from "@scrap/typings/runtime/index.ts?raw";
	import type {Entity} from "@scrap/types/Enity.svelte.ts";
	import type {HTMLAttributes} from "svelte/elements";
	import {app} from "@scrap/types/App.svelte.ts";
	import {onDestroy} from "svelte";
	import path from "path";
	import type {Variable} from "@scrap/types/Variable.ts";
	import {setupLanguage} from "@scrap/monaco-editor/setupLanguage.ts";

	globalThis.MonacoEnvironment = {
		getWorker: () => new Worker(),
	};

	setupLanguage("typescript");

	export interface Props extends HTMLAttributes<HTMLDivElement> {
		entity: Entity;
		invalid: boolean;
	}

	// #region Lib content builder utils
	function variablesReducer(prev: string, [name, type]: Variable) {
		return `${prev}\t${JSON.stringify(name)}: ${[type].flat().join(" | ")};\n`;
	}

	function fileNamer(file: File) {
		return JSON.stringify(path.parse(file.name).name);
	}

	function getSounds(sprite: Entity) {
		if (!sprite.sounds.length) {
			return "never";
		}

		return sprite.sounds.map(fileNamer).join(" | ");
	}

	function getCostumes(sprite: Entity) {
		return sprite.costumes.map(fileNamer).join(" | ");
	}
	// #endregion
</script>

<script lang="ts">
	let {entity, invalid = $bindable(false), ...props}: Props = $props();
	const main = editor.createModel(
		entity.typescript ?? "",
		"typescript",
		Uri.file("/script.ts"),
	);

	const types = editor.createModel(getLibs(), "typescript", Uri.file("/runtime.ts"));

	$effect(() => {
		types.setValue(getLibs());
	});

	let container = $state<HTMLDivElement>();
	let monaco: editor.IStandaloneCodeEditor | undefined;

	$effect(() => {
		monaco =
			container &&
			editor.create(container, {
				automaticLayout: true,
				minimap: {
					enabled: false,
				},
				model: main,
				colorDecorators: true,
			});
	});

	const changeListener = main.onDidChangeContent(() => {
		entity.typescript = main.getValue();
	});

	const decorationChange = main.onDidChangeDecorations(() => {
		const decorations = main.getAllDecorations(undefined, true);
		const errors = main.getAllDecorations(undefined, false);
		invalid = decorations.length !== errors.length;
	});

	onDestroy(() => {
		changeListener.dispose();
		decorationChange.dispose();
		types.dispose();
		main.dispose();
		monaco?.dispose();
	});

	// #region Lib content builder utils
	function getLibs() {
		const templates: Record<string, string> = {
			SPRITE: JSON.stringify(entity.name),
			SPRITES: app.entities.reduce(entitiesReducer, "\n"),
			BACKDROPS: getCostumes(app.stage),
		};
		return lib.replace(/__(\w+)__/g, (_, key: string) => templates[key]);
	}

	function getVariables(owner: Entity) {
		if (owner === entity) {
			return "Variables";
		}
		if (!owner.variables.length) {
			return "{}";
		}
		return owner.variables.reduce(variablesReducer, "{\n");
	}

	function entitiesReducer(prev: string, entity: Entity) {
		const constructor = entity.isStage ? "Stage" : "Sprite";
		const typeArgs = [getVariables(entity), getSounds(entity)];

		if (!entity.isStage) {
			typeArgs.push(getCostumes(entity));
		}

		return `${prev}\t${JSON.stringify(entity.name)}: ${constructor}<${typeArgs.join(", ")}>;\n`;
	}
	// #endregion
</script>

<div bind:this={container} {...props}></div>
