import {readFile} from "node:fs/promises";
import {XMLBuilder, XMLParser} from "fast-xml-parser";
import type {Plugin} from "vite";
import {type AOTPluginContext, createAOTComponentPlugin} from "./createAOTComponentPlugin";
import type {Props} from "../../src/components/Svg.svelte";

const parserOptions = Object.freeze({
	attributesGroupName: "attributes",
	attributeNamePrefix: "",
	cdataPropName: "__cdata",
	ignoreDeclaration: true,
	ignorePiTags: true,
	ignoreAttributes: false,
});

interface Node {
	[x: string]: Node | string | undefined;
}

const parser = new XMLParser(parserOptions);
const builder = new XMLBuilder(parserOptions);

/**
 * Not all <svg> attributes are supported by <symbol>
 * See https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/symbol#attributes
 * and https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/svg#attributes
 *
 * Also, remove size attributes, as those colide with <use>
 * https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/use
 */
const bannedAttributeNames = ["version", "baseProfile", "width", "height"];

export function svgPlugin(param: string): Plugin {
	let iconId = 0;

	return createAOTComponentPlugin({
		param,
		source: "/src/components/aot/Svg.svelte",
		async getVariables(ctx: AOTPluginContext): Promise<Props["vars"]> {
			const rawContent = await readFile(ctx.id, "utf-8");
			const parsed = parser.parse(rawContent) as {svg?: Node};

			if (!parsed.svg) {
				throw new SyntaxError("Invalid SVG File: Missing root <svg> tag.");
			}

			const attributes = parsed.svg[parserOptions.attributesGroupName];

			if (typeof attributes === "string") {
				throw new SyntaxError("Invalid SVG File: <attributes> is not a valid tag.");
			}

			if (typeof attributes === "object") {
				for (const banned of bannedAttributeNames) {
					// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
					delete attributes[banned];
				}
			}

			return {
				attributes: typeof attributes === "object" ? attributes : {},
				fileId: `svg${--iconId}`,
				raw: builder.build(parsed.svg),
			};
		},
		name: "svelte-svg-plugin",
	});
}
