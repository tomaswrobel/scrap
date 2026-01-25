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
	 * @fileoverview Costumes tab component.
	 * @copyright Tomáš Wróbel 2025
	 */
	import {app} from "@scrap/types/App.svelte";
	import Tab from "@juvofy/lib/components/navigation/Tab";
	import Brush from "@material-symbols/svg-400/rounded/brush-fill.svg?icon";
	import Upload from "@material-symbols/svg-400/rounded/upload.svg?icon";
	import {EntityAsset} from "@scrap/types/EntityAsset.svelte";
	import MediaList from "../MediaList.svelte";
	import Painterro from "../Painterro.svelte";
	import SpeedDial from "@juvofy/lib/components/actions/SpeedDial";
	import Button from "@juvofy/lib/components/actions/Button";

	async function uploadNewCostume() {
		const result = await app.dialog.fire({
			type: "file",
			title: "Upload new media",
			body: "Select one or more image to upload as the new entitie's costumes.",
			confirmButton: "Upload",
			inputOptions: {
				accept: "image/*",
				multiple: true,
			},
		});

		const file = result && result.item(0);

		if (!file) {
			return;
		}

		app.current.costumes.push(EntityAsset.fromFile(file));
	}

	function createNewEmptyCostume() {
		app.current.costumes.push(
			new EntityAsset(
				['<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480"></svg>'],
				"Empty",
				{type: "image/svg+xml"},
			),
		);
	}
</script>

<Tab label={app.current.isStage ? "Backdrops" : "Costumes"} id="costumes">
	<div class="flex h-full">
		<MediaList
			class="bg-base-200 gap-2 flex-col"
			items={app.current.costumes}
			bind:selected={app.current.currentCostume}
		>
			{#snippet image(costume)}
				<img
					src={costume.blobUrl}
					alt={costume.name}
					class="h-8 mx-auto border-base-300"
				/>
			{/snippet}
		</MediaList>
		<div class="grow">
			{#key app.current.currentCostume}
				<Painterro
					class="h-full rel"
					openImage={app.current.currentCostume.blobUrl}
					options={{
						saveHandler(image, doneCallback) {
							app.current.currentCostume.replaceWith(
								[image.asBlob()],
								"image/png",
							);
							doneCallback(false);
						},
						defaultSize: "640x480",
					}}
				/>
			{/key}
		</div>
	</div>
	<SpeedDial class="end-[unset] left-8">
		<Button class="btn-lg btn-circle" onclick={uploadNewCostume} title="Upload">
			<Upload class="w-6 fill-current" />
		</Button>

		<Button
			class="btn-lg btn-circle"
			onclick={createNewEmptyCostume}
			title="Create empty costume"
		>
			<Brush class="w-6 fill-current" />
		</Button>
	</SpeedDial>
</Tab>
