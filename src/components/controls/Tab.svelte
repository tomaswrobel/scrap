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
	 * @fileoverview Tab component.
	 * @copyright Tomáš Wróbel 2025
	 */
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
	onclick={() => {
		tabs.current = id;
	}}
	{...props}
	type="button"
	role="tab"
	class={[customClass, "tab"]}
	style:--tab-bg="#1e1e1e"
	aria-selected={isActive}
>
	{#if typeof label === "string"}
		{label}
	{:else}
		{@render label()}
	{/if}
</button>
