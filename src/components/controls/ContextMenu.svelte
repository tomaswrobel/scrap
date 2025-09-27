<script lang="ts" module>
	import type { SvelteHTMLElements } from "svelte/elements";
	import { onclick } from "./Dialog.svelte";
	import type { Tag } from "../../types/Tag";
	import type { Snippet } from "svelte";
	import * as Context from "$context";
	import { SvelteMap } from "svelte/reactivity";

	export type Props<T extends Tag> = SvelteHTMLElements[T] & {
		as: T;
		content: Snippet;
		menu: Snippet;

		children?: undefined;
		oncontextmenu?: undefined;
	};

	export type SubmenuData = [content: Snippet, opener?: HTMLButtonElement];

	declare module "$context" {
		interface Map {
			"menu:submenu": SvelteMap<string, SubmenuData>;
		}
	}

	export const MIN_SCREEN_OFFSET = 4;
</script>

<script lang="ts" generics="T extends Tag">
	const { as, content, menu, ...props }: Props<T> = $props();

	let left = $state<string>();
	let top = $state<string>();

	let menuWidth = $state(0);
	let menuHeight = $state(0);

	const submenuItems = new SvelteMap<string, SubmenuData>();

	function clear() {
		submenuItems.clear();
		submenuItems.set("$self", [menu]);
	}

	clear();
	Context.set("menu:submenu", submenuItems);
</script>

<svelte:element
	this={as}
	{...props}
	oncontextmenu={e => {
		e.preventDefault();
		e.stopPropagation();
		top = `${e.clientY + window.scrollY}px`;
		left = `${e.clientX + window.scrollX}px`;
		(e.currentTarget.nextElementSibling as HTMLDialogElement).showModal();
	}}
>
	{@render content()}
</svelte:element>

<dialog
	role="menu"
	class="absolute m-0 p-0 border-0 overflow-hidden bg-transparent"
	style:left
	style:top
	onclose={clear}
	{onclick}
>
	<div
		bind:clientHeight={menuHeight}
		bind:clientWidth={menuWidth}
		style:--divider-m="0"
		class={[
			"backdrop:bg-transparent bg-transparent m-0",
			"border-0 p-0 flex gap-px pointer-events-none",
		]}
	>
		{#each submenuItems.values() as submenu (submenu)}
			{@const [item, button] = submenu}
			<form
				method="dialog"
				class="bg-base-200 rounded-box h-fit"
				style:margin-top="{button?.parentElement?.offsetTop ?? 0}px"
				onsubmit={e => {
					e.submitter?.dispatchEvent(new Event("contextmenu:action"));
				}}
			>
				<ul class="menu pointer-events-auto h-fit shadow [&_hr]:hidden">
					{@render item()}
				</ul>
			</form>
		{/each}
	</div>
</dialog>
