<script lang="ts" module>
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
