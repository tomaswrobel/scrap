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
	 * @fileoverview Painterro component.
	 * @copyright Tomáš Wróbel 2025
	 */
	import Painterro, {type PainterroOptions} from "painterro";
	import {untrack} from "svelte";
	import "@scrap/css/painterro.css";
	import type {HTMLAttributes} from "svelte/elements";

	export interface Props extends HTMLAttributes<HTMLDivElement> {
		options?: Omit<PainterroOptions, "id">;
		openImage?: string | false;
	}
</script>

<script lang="ts">
	const {options, openImage, id: customId, class: customClass, ...props}: Props = $props();
	const componentId = $props.id();
	const id = $derived(customId ?? componentId);

	$effect(() => {
		const painterro = Painterro({
			onBeforeClose: () => {},
			hiddenTools: ["close", "open", "save", "resize", "rotate", "settings"],
			onImageLoaded() {
				painterro.setZoom(100);
			},
			toolbarHeightPx: 64,
			buttonSizePx: 42,
			backgroundFillColor: "#222",
			backgroundFillColorAlpha: 0,
			...options,
			id,
		});
		painterro.show(untrack(() => openImage));

		const saveInterval = setInterval(() => {
			painterro.save();
		}, 100);

		return () => {
			clearInterval(saveInterval);
			painterro.save();
			painterro.hide();
		};
	});
</script>

<div {...props} {id} class={[customClass, "relative"]}></div>
