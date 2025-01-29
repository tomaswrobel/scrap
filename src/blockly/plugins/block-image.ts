/**
 * This file is a part of Scrap Native, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomaswrobel/scrap.
 *
 * @license MIT
 * @fileoverview Export block as PNG image.
 * @copyright Tomáš Wróbel 2025
 *
 * This file adds a context menu item to blocks that allows exporting
 * the block as a PNG image. This feature was inspired by Snap!.
 * Snap! is a canvas application, so it can easily export the canvas,
 * but Blockly is SVG-based, so it's a bit more complicated.
 */
import * as Blockly from "blockly";
import Dialog from "@scrap/utils/dialog";
import {writeFile} from "@tauri-apps/plugin-fs";
import {load} from "@scrap/utils/decorators";
import savedAt from "@scrap/utils/saved-at";

/**
 * The padding around the block in the exported image.
 * While it's not necessary, it makes the image look nicer.
 */
const BLOCK_PADDING = 2;

/**
 * The scale of the exported image. Because PNG
 * is a raster format, small images can look blurry
 * when scaled up. And the block image is not
 * useful when it's as small as the block itself.
 */
const SCALE = 2;

/**
 * The encoder for saving the SVG data.
 */
const encoder = new TextEncoder();

/**
 * The class for saving the block image.
 */
class BlockSaver {
	private constructor(private readonly block: Blockly.BlockSvg) {}

	public static save(block: Blockly.BlockSvg) {
		new BlockSaver(block).toFile();
	}

	@load("Saving block image", true)
	public async toFile() {
		const renderer = this.block.workspace.getRenderer();
		const theme = this.block.workspace.getTheme();
		const root = this.block.getSvgRoot();

		// @ts-expect-error - cssNode is private.
		const css = renderer.getConstants().cssNode.innerText;
		const svg = root.cloneNode(true) as SVGSVGElement;

		// Remove all the unwanted attributes.
		svg.removeAttribute("transform"); // Block is translated in workspace.
		svg.removeAttribute("data-id"); // SVG does not allow data-* attributes.
		svg.removeAttribute("filter"); // Filter is highlighted block.

		const size = this.block.getHeightWidth();
		const width = size.width * SCALE;
		const height = size.height * SCALE;

		const svgData = `
			<svg 
			    xmlns="http://www.w3.org/2000/svg" 
			    xmlns:xlink="http://www.w3.org/1999/xlink"
			    width="${width}" height="${height}"
			    viewBox="0 0 ${size.width} ${size.height}"
			    class="${renderer.getClassName()} ${theme.getClassName()}" 
			>
				<style>
					${/*This is lost, because it's located in <head>.*/ ""}
					.blocklyIconGroup {
					    fill: #00f;
					    stroke: #fff;
					}
					
					.blocklyIconSymbol {
					    fill: #fff;
					}

					${css}
				</style>		
				${Blockly.utils.xml.domToText(svg)}
			</svg>
		`;

		const filters: Dialog.native.DialogFilter[] = [
			{name: "SVG", extensions: ["svg"]},
			{name: "PNG", extensions: ["png"]},
		];

		const path = await Dialog.native.save({
			filters,
			defaultPath: `${this.block.type}.svg`,
			title: "Export block image",
		});

		if (!path) {
			return "Saving cancelled.";
		}

		if (path.endsWith(".svg")) {
			await writeFile(path, encoder.encode(svgData.replace(/[\t\n]/g, "")));
		} else {
			const blob = await new Promise<Blob | null>(resolve => {
				const canvas = document.createElement("canvas");

				// Canvas has padding around the block.
				canvas.width = width + BLOCK_PADDING * 2;
				canvas.height = height + BLOCK_PADDING * 2;

				const ctx = canvas.getContext("2d")!;
				const img = new Image(width, height);

				img.onload = () => {
					ctx.drawImage(img, BLOCK_PADDING, BLOCK_PADDING, width, height);
					canvas.toBlob(resolve);
				};

				img.src = `data:image/svg+xml;utf-8,${encodeURIComponent(svgData)}`;
			});

			if (!blob) {
				return "Failed to create image.";
			}

			const buffer = await blob.arrayBuffer();
			const uint8 = new Uint8Array(buffer);
			await writeFile(path, uint8);
		}
		return savedAt(path);
	}
}

Blockly.ContextMenuRegistry.registry.register({
	displayText: "Save block image",
	scopeType: Blockly.ContextMenuRegistry.ScopeType.BLOCK,
	id: "export_block_image",
	weight: Infinity,

	preconditionFn(scope) {
		// Disable the option in the flyout.
		if (scope.block!.isInFlyout) {
			return "hidden";
		}
		// spritePanel is a special block that is not a block.
		if (scope.block!.type === "spritePanel") {
			return "hidden";
		}
		return "enabled";
	},

	callback: ({block}) => {
		if (block) {
			BlockSaver.save(block);
		}
	},
});
