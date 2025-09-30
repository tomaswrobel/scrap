<script lang="ts" module>
	import {tw} from "@scrap/utils/tw";
	import type {Snippet} from "svelte";
	import type {HTMLButtonAttributes} from "svelte/elements";

	export interface Props extends HTMLButtonAttributes {
		variant?: "primary" | "secondary" | "accent";
		children: Snippet;
	}

	const variants = tw.map({
		primary: "btn-primary",
		secondary: "btn-secondary",
		accent: "btn-accent",
	});
</script>

<script lang="ts">
	const {variant, class: customClass, type = "button", children, ...props}: Props = $props();
</script>

<button {type} class={["btn", variant && variants[variant], customClass]} {...props}>
	{@render children()}
</button>
