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
	 * @fileoverview Daisy UI button component.
	 * @copyright Tomáš Wróbel 2025
	 */
	import {tw} from "@scrap/utils/tw.ts";
	import type {Snippet} from "svelte";
	import type {HTMLButtonAttributes} from "svelte/elements";

	const variants = tw.map({
		primary: "btn-primary",
		secondary: "btn-secondary",
		accent: "btn-accent",
		ghost: "btn-ghost",
		fab: "btn-lg btn-circle",
	});

	export interface Props extends HTMLButtonAttributes {
		variant?: keyof typeof variants;
		children: Snippet;
	}
</script>

<script lang="ts">
	const {variant, class: customClass, type = "button", children, ...props}: Props = $props();
</script>

<button {...props} {type} class={["btn", variant && variants[variant], customClass]}>
	{@render children()}
</button>
