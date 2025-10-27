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
	 * @fileoverview MediaList component.
	 * @copyright Tomáš Wróbel 2025
	 */
	import type {Snippet} from "svelte";
	import type {HTMLAttributes} from "svelte/elements";
	import Close from "@material-symbols/svg-400/rounded/close.svg?icon";
	import Button from "./controls/Button.svelte";
	import {app} from "@scrap/types/App.svelte.ts";

	export interface NamableItem {
		name: string;
	}

	export interface Props<T extends NamableItem> extends HTMLAttributes<HTMLDivElement> {
		items: T[];
		selected: T;
		image: Snippet<[T]>;
		isDeletable?(item: T): boolean;
	}
</script>

<script lang="ts" generics="T extends NamableItem">
	let {
		items,
		image,
		selected = $bindable(items[0]),
		class: customClass,
		isDeletable = () => true,
		...props
	}: Props<T> = $props();

	const name = $props.id();

	async function deleteAt(index: number) {
		const postfix = ["st", "nd", "rd"][index] ?? "th";

		const confirmed = await app.dialog.fire({
			title: `Are you sure you want to delete the item?`,
			body: `This can't be undone. Be careful, the ${index + 1}${postfix} item will get lost in my memory.`,
		});

		if (confirmed && items.splice(index, 1)[0] === selected) {
			[selected] = items;
		}
	}
</script>

<div class={["flex p-4", customClass]} {...props}>
	{#each items as item, index (item)}
		{@const inputId = `${name}-option-${index}`}
		<label
			for={inputId}
			class={[
				selected === item
					? "border-primary"
					: "border-transparent hover:border-base-300 cursor-pointer",
				"flex flex-col w-20 relative  mb-2",
				"bg-base-100 border-2 rounded-lg ",
			]}
		>
			<input
				{name}
				type="radio"
				id={inputId}
				bind:group={selected}
				value={item}
				class="hidden"
			/>
			<div class="grow shrink-0 p-2">
				{@render image(item)}
			</div>
			<div
				class={[
					"text-center border-t p-1",
					selected === item
						? "bg-primary text-primary-content border-transparent"
						: "bg-base-200 text-base-content border-base-300",
				]}
			>
				<input
					type="text"
					class="appearance-none text-center text-ellipsis outline-0! w-full! text-sm h-5 cursor-text read-only:pointer-events-none"
					bind:value={item.name}
					readonly={selected !== item}
				/>
			</div>
			{#if selected === item && isDeletable(item) && items.length > 1}
				<Button
					class="btn-xs btn-error btn-circle absolute -right-3 -top-3"
					onclick={() => deleteAt(index)}
				>
					<Close class="w-4 fill-current" />
				</Button>
			{/if}
		</label>
	{/each}
</div>
