import * as Blockly from "blockly";
import {saveAs} from "file-saver";

const BLOCK_PADDING = 2;

Blockly.ContextMenuRegistry.registry.register({
	displayText: "Save block image",
	preconditionFn: (scope) => scope.block!.isInFlyout ? "hidden" : "enabled",
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

		// @ts-expect-error - private
		const css = renderer.getConstants().cssNode.innerText;
		const svg = root.cloneNode(true) as SVGSVGElement;

		svg.removeAttribute("transform");
		svg.removeAttribute("data-id");
		svg.removeAttribute("filter");

		const canvas = document.createElement("canvas");
		const size = block.getHeightWidth();
		const width = size.width * 2;
		const height = size.height * 2;

		const svgData = `
			<svg 
				xmlns="http://www.w3.org/2000/svg" 
				xmlns:xlink="http://www.w3.org/1999/xlink"
				width="${width}" height="${height}"
				viewBox="0 0 ${size.width} ${size.height}"
				class="${renderer.getClassName()} ${theme.getClassName()}" 
			>
				<style>
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
