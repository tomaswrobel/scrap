<script lang="ts" module>
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	export interface Props extends HTMLAttributes<HTMLDivElement> {
		placement: "top" | "left" | "right" | "bottom";
		content: string | Snippet;
		children: Snippet;
	}

	void ["tooltip-left", "tooltip-top", "tooltip-right", "tooltip-bottom"];
</script>

<script lang="ts">
	const { placement, class: customClass, content, children, ...rest }: Props = $props();
</script>

{#if typeof content === "string"}
	<div
		data-tip={content}
		class={["tooltip", placement && `tooltip-${placement}`, customClass]}
		{...rest}
	>
		{@render children()}
	</div>
{:else}
	<div class={["tooltip", placement, customClass]} {...rest}>
		<div class="tooltip-content">
			{@render content()}
		</div>
		{@render children()}
	</div>
{/if}
