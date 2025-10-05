<script lang="ts" module>
	import {event} from "@scrap/utils/event.ts";
	import Chevron from "../../assets/chevron-right.svg?icon";
	import type {Snippet} from "svelte";
	import type {HTMLButtonAttributes} from "svelte/elements";
	import * as Context from "$context";
	import {assert} from "@scrap/utils/assert";

	export interface BaseProps extends HTMLButtonAttributes {
		onclick?: undefined;
		type?: undefined;
	}

	export interface PropsWithoutSubmenu extends BaseProps {
		children: Snippet;
		content?: undefined;
		submenu?: undefined;
		onuse?(this: void): void;
	}

	export interface PropsWithSubmenu extends BaseProps {
		children?: undefined;
		content: Snippet;
		submenu: Snippet;
		onuse?: undefined;
	}

	export type Props = PropsWithSubmenu | PropsWithoutSubmenu;
</script>

<script lang="ts">
	const {children, content, submenu, onuse, ...props}: Props = $props();
	const submenuItems = Context.get("menu:submenu");
	const instanceId = crypto.randomUUID();
</script>

<li>
	{#if children}
		<button type="submit" {...props} {@attach event("contextmenu:action", onuse)}>
			{@render children()}
		</button>
	{:else}
		<button
			{...props}
			type="button"
			class="flex justify-between gap-2"
			onclick={e => {
				let isSubitem = false;
				if (submenuItems.has(instanceId)) {
					// Close the item and its children
					for (const id of submenuItems.keys()) {
						if ((isSubitem ||= id === instanceId)) {
							submenuItems.delete(id);
						}
					}
				} else if (submenu) {
					const menu = e.currentTarget.closest("ul.menu");
					assert(menu, "ContextMenuOption cannot be used outside ContextMenu");

					// Close potential siblings and their children
					const siblings = Array.from(menu.querySelectorAll("button"));

					for (const [id, [, button]] of submenuItems) {
						if (button && (isSubitem ||= siblings.includes(button))) {
							submenuItems.delete(id);
						}
					}
					submenuItems.set(instanceId, [submenu, e.currentTarget]);
				}
			}}
		>
			<span>{@render content()}</span>
			<Chevron class="size-[1em]" />
		</button>
	{/if}
</li>
