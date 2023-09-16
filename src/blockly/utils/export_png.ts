import * as Blockly from "blockly/core";
import {saveAs} from "file-saver";

Blockly.ContextMenuRegistry.registry.register({
	displayText: "Save block image",
	preconditionFn: () => "enabled",
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

		svg.lastElementChild!.remove();

		const canvas = document.createElement("canvas");
		const svgData = new XMLSerializer().serializeToString(svg);
        const size = block.getHeightWidth();

		canvas.width = size.width + 2;
		canvas.height = size.height + 2;

		const ctx = canvas.getContext("2d")!;
		const img = new Image();
		img.onload = () => {
			ctx.drawImage(img, 1, 1, size.width, size.height);
			canvas.toBlob(e => saveAs(e!, `${block.type}.png`));
		};
		img.src =
			"data:image/svg+xml;utf-8," +
			encodeURIComponent(`<svg class="${renderer.getClassName()} ${theme.getClassName()}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${size.width}" height="${size.height}"><style>${css}</style>${svgData}</svg>`);
	},
});