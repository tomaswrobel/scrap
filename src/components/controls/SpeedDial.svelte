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
	 * @fileoverview daisyUI component for having multiple options how to add something.
	 * @copyright Tomáš Wróbel 2025
	 */
	import Close from "@material-symbols/svg-400/rounded/close.svg?icon";
	import Add from "@material-symbols/svg-400/rounded/add.svg?icon";
	import type {HTMLAttributes} from "svelte/elements";

	export interface Props extends HTMLAttributes<HTMLDivElement> {}
</script>

<script lang="ts">
	const {children, ...props}: Props = $props();
</script>

<div {...props} class={["fab items-start", props.class]}>
	<!-- a focusable div with tabindex is necessary to work on all browsers. role="button" is necessary for accessibility -->
	<div tabindex="0" role="button" class="btn btn-lg btn-circle btn-primary" title="Add">
		<Add class="w-6 fill-current" />
	</div>

	<div class="fab-close">
		<span class="btn btn-lg btn-error btn-circle">
			<Close class="w-6 fill-current" />
		</span>
	</div>

	{@render children?.()}
</div>
