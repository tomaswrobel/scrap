<script lang="ts" module>
	import { onDestroy } from "svelte";
	import type { SVGAttributes } from "svelte/elements";
	import { SvelteMap } from "svelte/reactivity";

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
	const { vars, ...props }: Props = $props();
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

	/* eslint-disable svelte/no-at-html-tags */
</script>

<svg {...props}>
	{#if isSource}
		<symbol {...vars.attributes} id={vars.fileId}>
			{@html vars.raw}
		</symbol>
	{/if}
	<use href="#{vars.fileId}" />
</svg>
