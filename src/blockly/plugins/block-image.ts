/**
 * This file is a part of Scrap, an educational programming language.
 * You should have received a copy of the MIT License, if not, please 
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomas-wrobel/scrap. 
 * 
 * @license MIT
 * @fileoverview Export block as PNG image.
 * @author Tomáš Wróbel
 * 
 * This file adds a context menu item to blocks that allows exporting
 * the block as a PNG image. This feature was inspired by Snap!.
 * Snap! is a canvas application, so it can easily export the canvas,
 * but Blockly is SVG-based, so it's a bit more complicated.
 */
import * as Blockly from "blockly";
import {saveAs} from "file-saver";

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

Blockly.ContextMenuRegistry.registry.register({
	displayText: "Save block image",
	preconditionFn: (scope) => {
		// Disable the option in the flyout.
		if (scope.block!.isInFlyout) {
			return "hidden";
		}
		if (scope.block!.type === "spritePanel") {
			return "hidden";
		}
		return "enabled";
	},
	scopeType: Blockly.ContextMenuRegistry.ScopeType.BLOCK,
	id: "export_png",
	weight: Infinity,
	callback: ({block}) => {
		if (!block) {
			return;
		}

		const renderer = block.workspace.getRenderer();
		const theme = block.workspace.getTheme();
		const root = block.getSvgRoot();

		// @ts-expect-error - cssNode is private.
		const css = renderer.getConstants().cssNode.innerText;
		const svg = root.cloneNode(true) as SVGSVGElement;

		// Remove all the unwanted attributes.
		svg.removeAttribute("transform"); // Block is translated in workspace.
		svg.removeAttribute("data-id"); // SVG does not allow data-* attributes.
		svg.removeAttribute("filter"); // Filter is highlighted block.

		const canvas = document.createElement("canvas");
		const size = block.getHeightWidth();
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
					${/*This is lost, because it's located in <head>.*/""}
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

		// Canvas has padding around the block.
		canvas.width = width + BLOCK_PADDING * 2;
		canvas.height = height + BLOCK_PADDING * 2;

		const ctx = canvas.getContext("2d")!;
		const img = new Image(width, height);

		img.onload = () => {
			ctx.drawImage(img, BLOCK_PADDING, BLOCK_PADDING, width, height);
			canvas.toBlob(e => saveAs(e!, `${block.type}.png`));
		};

		img.src = "data:image/svg+xml;utf-8," + encodeURIComponent(svgData);
	},
});
