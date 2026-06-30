/// <reference types="svelte" />
/// <reference types="astro/client" />

declare interface ViteTypeOptions {
	strictImportMetaEnv: true;
}

declare interface ImportMetaEnv {
	PUBLIC_BLOCKLY_MEDIA_PATH: string;
}

declare module "@scrap/compiler/pkg" {
	export function parse(code: string): import("@swc/types").Module;
	export function transform(code: string): string | null;
	export function getVariables(code: string): import("@scrap/types/Variable").Variable[];
}

declare module "*?icon" {
	import type {Component} from "svelte";
	import type {SVGAttributes} from "svelte/elements";

	const Icon: Component<SVGAttributes<SVGSVGElement>>;
	export default Icon;
}

declare module "*?shiki" {
	import type {Component} from "svelte";
	import type {HTMLAttributes} from "svelte/elements";

	const Code: Component<HTMLAttributes<HTMLDivElement>>;
	export default Code;
}

declare module "*&shiki" {
	export {default} from "?shiki";
}
