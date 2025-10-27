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
	 * @fileoverview Dropdown component.
	 * @copyright Tomáš Wróbel 2025
	 */
	import type {Snippet} from "svelte";
	import type {HTMLAttributes} from "svelte/elements";

	export interface Props extends HTMLAttributes<HTMLDivElement> {
		children?: undefined;
		content: Snippet;
		button: Snippet;
	}
</script>

<script lang="ts">
	const {content, button, ...props}: Props = $props();
</script>

<div {...props} class={["dropdown", props.class]}>
	{@render button()}
	<ul tabindex="-1" class="menu dropdown-content bg-base-100 z-80 mt-3 min-w-52 p-2 shadow">
		{@render content()}
	</ul>
</div>
