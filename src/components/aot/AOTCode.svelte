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
	 * @fileoverview AOT Code component. Used by ?shiki import suffix.
	 * @copyright Tomáš Wróbel 2025
	 */
	import type {HTMLAttributes, MouseEventHandler} from "svelte/elements";

	export interface Props extends HTMLAttributes<HTMLDivElement> {
		vars: {
			raw: string;
			filename: string;
		};
	}
</script>

<script lang="ts">
	const {vars}: Props = $props();
	let copied = $state(false);

	$effect(() => {
		if (copied) {
			const pid = setTimeout(() => (copied = false), 1500);
			return () => {
				clearTimeout(pid);
			};
		}
	});

	const copy: MouseEventHandler<HTMLButtonElement> = async ({
		currentTarget: {nextElementSibling: pre},
	}) => {
		if (pre instanceof HTMLPreElement) {
			await navigator.clipboard.writeText(pre.textContent);
		}
		copied = true;
	};

	/* eslint-disable svelte/no-at-html-tags */
</script>

<div style="--filename: '{vars.filename}';">
	<button onclick={copy} disabled={copied}>
		{#if copied}
			Copied &check;
		{:else}
			Copy
		{/if}
	</button>
	{@html vars.raw}
</div>

<style>
	div {
		display: flex;
		flex-direction: column;
		position: relative;
		text-align: left;
		max-width: 100%;
	}

	div > :global(pre) {
		padding: 0 0.5rem;
		padding-bottom: 1rem;
		margin: 0;
		max-width: 100%;
		overflow-x: auto;
	}

	div > :global(pre)::before {
		content: var(--filename);
		display: block;
		padding: 0.5rem 0;
		border-bottom: 1px solid currentColor;
		margin-bottom: 1rem;
		font-size: 0.75em;
	}

	div > button {
		all: unset;
		appearance: none;
		display: block;
		position: absolute;
		top: 0.5rem;
		font-size: 0.75em;
		right: 0.5rem;
		font-family: monospace;

		&:enabled:hover {
			cursor: pointer;
			text-decoration: underline;
		}
	}
</style>
