<script lang="ts">
	/**
	 * This file is a part of Scrap, an app for helping to migrate
	 * from block-based programming into text-based programming languages.
	 *
	 * You should have received a copy of the MIT License, if not, please
	 * visit https://opensource.org/licenses/MIT. To verify the code, visit
	 * the official repository at https://github.com/tomaswrobel/scrap.
	 *
	 * @license MIT
	 * @fileoverview Card linking to a single category on the /docs overview page.
	 * @copyright Tomáš Wróbel 2025
	 */
	import Card from "@juvofy/lib/components/display/Card";

	const {
		name,
		slug,
		description,
		colour,
		count,
	}: {name: string; slug: string; description: string; colour: string; count: number} =
		$props();
</script>

<a href={`/docs/${slug}`} class="contents">
	<Card decoration="border" class="bg-base-100 hover:shadow-lg transition-shadow h-full">
		<div class="flex items-center gap-3">
			<span class="categoryBubble" style="background-color: {colour}"></span>
			<h2 class="card-title">{name}</h2>
		</div>
		{#if description}
			<p class="text-base-content/70 text-sm">{description}</p>
		{/if}
		<p class="text-sm font-semibold text-base-content/60 mt-auto pt-2">
			{count}
			{count === 1 ? "block" : "blocks"}
		</p>
	</Card>
</a>

<style>
	.categoryBubble {
		display: inline-block;
		position: relative;
		border-radius: 100%;
		width: 1.1rem;
		height: 1.1rem;
		flex-shrink: 0;
	}

	.categoryBubble::after {
		all: inherit;
		content: "";
		position: absolute;
		filter: brightness(0.6);
		top: 0;
		left: 0;
		transform: scale(1.1);
		transform-origin: center;
		z-index: -1;
	}
</style>
