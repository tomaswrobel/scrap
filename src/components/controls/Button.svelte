<script lang="ts" module>
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
