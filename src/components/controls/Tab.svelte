<script lang="ts" module>
	import {event} from "@scrap/utils/event";
	import type {Snippet} from "svelte";
	import type {HTMLButtonAttributes} from "svelte/elements";
	import * as Context from "$context";
	import {TabContextKey} from "./Tabs.svelte";

	export interface Props extends HTMLButtonAttributes {
		id: string;
		label: string | Snippet;

		children: Snippet;
		tab?: string;
		type?: undefined;
		role?: undefined;
	}
</script>

<script lang="ts">
	const {class: customClass, label, children, id, ...props}: Props = $props();
	const tabs = Context.get(TabContextKey);
	const isActive = $derived.by(() => {
		if (tabs.content.has(tabs.current)) {
			return tabs.current === id;
		}
		return tabs.content.keys().next().value === id;
	});

	$effect(() => {
		tabs.content.set(id, children);
		return () => {
			tabs.content.delete(id);
		};
	});
</script>

<button
	{...props}
	type="button"
	role="tab"
	class={[customClass, "tab"]}
	aria-selected={isActive}
	{@attach event("click", () => {
		tabs.current = id;
	})}
>
	{#if typeof label === "string"}
		{label}
	{:else}
		{@render label()}
	{/if}
</button>
