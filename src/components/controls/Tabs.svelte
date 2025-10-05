<script lang="ts" module>
	import {tw} from "@scrap/utils/tw.ts";
	import type {Snippet} from "svelte";
	import * as Context from "$context";
	import type {HTMLAttributes} from "svelte/elements";
	import {SvelteMap} from "svelte/reactivity";

	const variants = tw.map({
		lift: "tabs-lift",
		box: "tabs-box",
		border: "tabs-border",
	});

	export interface Props extends HTMLAttributes<HTMLDivElement> {
		children: Snippet;
		variant?: keyof typeof variants;
		tab?: string;
		role?: undefined;
	}

	export const TabContextKey = Symbol("Tabs.$Context");

	export interface Tabs {
		current: string;
		readonly tabs: string[];
		readonly listId: string;
		readonly panelId: string;
		readonly content: SvelteMap<string, Snippet>;
	}

	declare module "$context" {
		interface Map {
			[TabContextKey]: Tabs;
		}
	}
</script>

<script lang="ts">
	let {
		variant,
		id: customId,
		class: customClass,
		children,
		tab = $bindable(""),
		...props
	}: Props = $props();

	const tabs = $state<string[]>([]);
	const contentMap = new SvelteMap<string, Snippet>();
	const generatedId = $props.id();
	const id = $derived(customId ?? generatedId);
	const panelId = $derived(`${id}.panel`);

	Context.set(TabContextKey, {
		get current() {
			return tab;
		},
		set current(value) {
			tab = value;
		},
		get tabs() {
			return tabs;
		},
		get listId() {
			return id;
		},
		get panelId() {
			return panelId;
		},
		get content() {
			return contentMap;
		},
	});

	const content = $derived.by(() => {
		if (contentMap.has(tab)) {
			return contentMap.get(tab);
		}
		return contentMap.values().next().value;
	});
</script>

<div {...props} role="tablist" {id} class={["tabs", variant && variants[variant], customClass]}>
	{@render children()}
	<div {...props} id={panelId} role="tabpanel" class="tab-content">
		{@render content?.()}
	</div>
</div>
