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
	 * @fileoverview AOT SVG component. Used by ?icon import suffix.
	 * @copyright Tomáš Wróbel 2025
	 */
	import {onDestroy} from "svelte";
	import type {SVGAttributes} from "svelte/elements";
	import {SvelteMap} from "svelte/reactivity";

	const sources = new SvelteMap<string, string>();

	export interface Props extends SVGAttributes<SVGSVGElement> {
		vars: {
			raw: string;
			fileId: string;
			attributes: SVGAttributes<SVGSymbolElement>;
		};
	}
</script>

<script lang="ts">
	const {vars, ...props}: Props = $props();
	const instanceId = $props.id();

	$effect(() => {
		if (!sources.has(vars.fileId)) {
			sources.set(vars.fileId, instanceId);
		}
	});

	const isSource = $derived(sources.get(vars.fileId) === instanceId);

	onDestroy(() => {
		if (isSource) {
			sources.delete(vars.fileId);
		}
	});

	const aspectRatio = $derived.by(() => {
		const [, , width, height] = vars.attributes.viewBox?.split(" ").map(Number) ?? [];
		return width / height || undefined;
	});

	/* eslint-disable svelte/no-at-html-tags */
</script>

<svg {...props} style:aspect-ratio={aspectRatio}>
	{#if isSource}
		<symbol {...vars.attributes} id={vars.fileId}>
			{@html vars.raw}
		</symbol>
	{/if}
	<use href="#{vars.fileId}" />
</svg>
