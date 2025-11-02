<script lang="ts" module>
	/**
	 * This file is a part of Scrap, an app for helping to migrate
	 * from block-based programming into text-based programming languages.
	 *
	 * You should have received a copy of the MIT License, if not, please
	 * visit https://opensource.org/licenses/MIT. To verify the code, visit
	 * the official repository at https://github.com/tomaswrobel/scrap.
	 *
	 * @license MIT
	 * @fileoverview Blockly workspace component.
	 * @copyright Tomáš Wróbel 2025
	 */
	import type {Entity} from "@scrap/types/Enity.svelte.ts";
	import {Blockly, spriteToolbox, stageToolbox, theme} from "@scrap/blockly";
	import type {HTMLAttributes} from "svelte/elements";
	import {createVariableCategory} from "@scrap/blockly/utils/createVariableCategory.ts";
	import {app} from "@scrap/types/App.svelte.ts";

	export interface Props extends HTMLAttributes<HTMLDivElement> {
		entity: Entity;
		isDemo: boolean;
	}

	Blockly.dialog.setAlert((message: string, callback) => {
		app.dialog.fire({title: message}).then(callback);
	});

	Blockly.dialog.setConfirm((message: string, callback) => {
		app.dialog
			.fire({
				title: message,
				confirmButton: "Yes",
				cancelButton: "No",
			})
			.then(callback);
	});

	Blockly.dialog.setPrompt((message: string, defaultValue: string, callback) => {
		app.dialog
			.fire({
				type: "text",
				title: message,
				value: defaultValue,
				confirmButton: "OK",
				cancelButton: "Cancel",
			})
			.then(result => {
				callback(result === false ? null : result);
			});
	});

	let demoApplied = false;
</script>

<script lang="ts">
	const {entity, isDemo, ...props}: Props = $props();
	const toolbox = $derived<Blockly.utils.toolbox.ToolboxDefinition>({
		kind: "categoryToolbox",
		contents: entity.isStage ? stageToolbox : spriteToolbox,
	});

	let workspace: Blockly.WorkspaceSvg | undefined;
	let container = $state<HTMLDivElement>();

	$effect(() => {
		if (!container) {
			return;
		}

		workspace = Blockly.inject(container, {
			theme,
			renderer: "scrap",
			toolbox,
			media: import.meta.env.PUBLIC_BLOCKLY_MEDIA_PATH,
			zoom: {
				startScale: 0.65,
			},
			grid: {
				spacing: 20,
				length: 1,
				colour: "#222",
			},
			move: {
				drag: false,
				wheel: true,
				scrollbars: true,
			},
			collapse: false,
			oneBasedIndex: false,
			disable: false,
		});

		workspace.registerToolboxCategoryCallback("VARIABLE", createVariableCategory);

		workspace.addChangeListener(e => {
			if (e instanceof Blockly.Events.UiBase) {
				return;
			}
			Blockly.serialization.workspaces.load(
				Blockly.serialization.workspaces.save(e.getEventWorkspace_()),
				app.current.workspace,
			);
		});

		Blockly.serialization.workspaces.load(
			Blockly.serialization.workspaces.save(app.current.workspace),
			workspace,
		);

		if (isDemo && !demoApplied) {
			workspace.newBlock("controls_if").initSvg();
			demoApplied = true;
		}

		return () => {
			workspace?.dispose();
			workspace = undefined;
		};
	});

	$effect(() => {
		void app.size;
		window.requestAnimationFrame(() => workspace && Blockly.svgResize(workspace));
	});
</script>

<div bind:this={container} {...props} class={["blockly", props.class]}></div>

<style>
	.blockly {
		all: initial;
	}

	:global(.blocklyToolboxCategoryLabel) {
		font-size: 0.75rem !important;
	}

	:global(.blocklyTreeRowContentContainer) {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	:global(.blocklyToolboxCategory) {
		line-height: 1.375rem;
		white-space: nowrap;
		padding: 0.5rem 0;
		margin: 0;
		cursor: pointer;
		height: unset;
	}

	:global(.blocklyToolboxCategoryGroup) {
		margin: 0 auto;
	}

	:global(.blocklyToolboxSelected) {
		position: relative;

		:global(.blocklyToolboxCategoryLabel) {
			color: inherit;
		}

		&::after {
			content: "";
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background: rgba(255, 255, 255, 0.1);
			z-index: -2;
		}
	}

	:global(.blocklyToolbox) {
		padding-top: 0;
		position: static;
		width: fit-content;
	}

	:global(.blocklyFlyout),
	:global(.blocklyToolbox) {
		border-right: 1px solid rgba(0, 0, 0, 0.1);
	}

	:global(.blocklyFlyoutButton) {
		cursor: pointer;
	}

	:global(.blocklyFlyoutLabelText) {
		font-size: 1.25rem !important;
	}

	:global(.blocklyIconGroup) {
		cursor: pointer;
		filter: brightness(110%);

		&:not(:hover) {
			opacity: 1;
			filter: none;
		}
	}

	:global(.blocklyIconSymbol) {
		fill: white;
	}

	:global(.blocklyHtmlInput)::-webkit-calendar-picker-indicator {
		display: none;
	}

	:global(.blocklyMenu) {
		padding: 0 !important;
		box-sizing: content-box;

		&::-webkit-scrollbar {
			display: none;
		}
	}

	:global(.blocklyMenuItemDisabled) {
		color: #0005;
	}

	:global(.blocklyMainBackground) {
		stroke-width: 0;
	}

	:global(.blocklyHtmlInput) {
		background: white;
	}

	:global(.categoryBubble) {
		margin: 0 auto 0.125rem;
		border-radius: 100%;
		position: relative;
		margin-bottom: 0.25rem;
		width: 1.25rem;
		height: 1.25rem;

		&::after {
			all: inherit;
			content: "";
			position: absolute;
			filter: brightness(0.6);
			top: 0;
			left: 0;
			transform: scale(1.1);
			transform-origin: center;
			z-index: -1;
		}
	}

	:global(.fieldColourSliderLabel) {
		font-size: 1rem;
		color: black;
	}

	:global(.injectionDiv) {
		display: flex;
	}
</style>
