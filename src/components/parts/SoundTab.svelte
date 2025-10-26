<script lang="ts" module>
	import {EntityAsset} from "@scrap/types/EntityAsset.svelte";
	import Note from "@material-symbols/svg-400/rounded/music_note.svg?icon";
	import type {Attachment} from "svelte/attachments";
	import WaveSurfer from "wavesurfer.js";
	import MediaList from "../MediaList.svelte";
	import {app} from "@scrap/types/App.svelte.ts";
	import Tab from "../controls/Tab.svelte";
	import Upload from "@material-symbols/svg-400/rounded/upload.svg?icon";
	import SpeedDial from "@scrap/components/controls/SpeedDial.svelte";
	import Button from "../controls/Button.svelte";

	function attachWavesurfer(sound: EntityAsset): Attachment<HTMLDivElement> {
		return function (container) {
			const primary = window
				.getComputedStyle(container)
				.getPropertyValue("--color-primary");

			const wavesurfer = new WaveSurfer({
				container,
				url: sound.blobUrl,
				waveColor: primary,
				normalize: true,
				height: "auto",
			});

			wavesurfer.on("interaction", () => {
				wavesurfer.playPause();
			});

			return () => {
				wavesurfer.destroy();
			};
		};
	}

	async function uploadNewSound() {
		const result = await app.dialog.fire({
			type: "file",
			title: "Upload new media",
			body: "Select one or more aduios to upload as the new entitie's sounds.",
			confirmButton: "Upload",
			inputOptions: {
				accept: "audio/*",
				multiple: true,
			},
		});

		const file = result && result.item(0);

		if (!file) {
			return;
		}

		app.current.sounds.push(EntityAsset.fromFile(file));
	}
</script>

<script lang="ts">
	let selected = $state<EntityAsset>(app.current.sounds[0]);
</script>

<Tab label="Sounds" id="sounds">
	<SpeedDial class="end-[unset] left-8">
		<Button variant="fab" onclick={uploadNewSound}>
			<Upload class="w-6 fill-current" />
		</Button>
	</SpeedDial>

	<div class="flex h-full">
		<MediaList class="bg-base-200 gap-2 flex-col" items={app.current.sounds} bind:selected>
			{#snippet image()}
				<Note class="fill-base-content size-10 mx-auto" />
			{/snippet}
		</MediaList>
		<div class="grow bg-[#1e1e1e]" {@attach attachWavesurfer(selected)}></div>
	</div>
</Tab>
