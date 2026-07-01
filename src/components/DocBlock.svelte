<script lang="ts">
	/**
	 * This file is a part of Scrap, an app for helping to migrate
	 * from block-based programming into text-based programming languages.
	 *
	 * You should have received a copy of the MIT License, if not, please
	 * visit https://opensource.org/licenses/MIT. To verify the code, visit
	 * the official repository at https://github.com/tomaswrobel/scrap.
	 *
	 * @license MIT
	 * @fileoverview Renders a single, static toolbox block as a mini workspace.
	 * @copyright Tomáš Wróbel 2025
	 */
	import {Blockly, theme} from "@scrap/blockly";

	const {
		blockState,
		scale = 0.8,
	}: {blockState: Blockly.serialization.blocks.State; scale?: number} = $props();

	const MARGIN = 4;

	let container = $state<HTMLDivElement>();

	$effect(() => {
		if (!container) {
			return;
		}

		let workspace: Blockly.WorkspaceSvg | undefined;
		let disposed = false;

		(async () => {
			// Blockly measures block widths from the rendered text, so the Geist
			// font has to be ready before the workspace is laid out; otherwise the
			// blocks are sized against a fallback font and the labels get clipped.
			await document.fonts.load("bold 12pt Geist");
			if (disposed || !container) {
				return;
			}

			workspace = Blockly.inject(container, {
				theme,
				renderer: "scrap",
				readOnly: true,
				media: import.meta.env.PUBLIC_BLOCKLY_MEDIA_PATH,
				zoom: {startScale: scale},
				move: {drag: false, wheel: false, scrollbars: false},
			});

			const block = Blockly.serialization.blocks.append(
				blockState,
				workspace,
			) as Blockly.BlockSvg;
			block.moveTo(new Blockly.utils.Coordinate(MARGIN, MARGIN));

			const {width, height} = block.getHeightWidth();
			container.style.width = `${(width + MARGIN * 2) * scale}px`;
			container.style.height = `${(height + MARGIN * 2) * scale}px`;
			Blockly.svgResize(workspace);
		})();

		return () => {
			disposed = true;
			workspace?.dispose();
		};
	});
</script>

<div bind:this={container} class="doc-block"></div>

<style>
	.doc-block {
		all: initial;
		display: inline-block;
	}

	/* Let the block float on the page instead of inside a dark workspace box. */
	:global(.doc-block .blocklyMainBackground) {
		fill: none;
		stroke: none;
	}

	:global(.doc-block .injectionDiv) {
		overflow: visible;
	}
</style>
