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
	 * @fileoverview App component.
	 * @copyright Tomáš Wróbel 2025
	 */
	import {app} from "@scrap/types/App.svelte.ts";
	import CodePanel from "@scrap/components/parts/CodePanel.svelte";
	import Upload from "@material-symbols/svg-400/rounded/upload.svg?icon";
	import Home from "@material-symbols/svg-400/rounded/home.svg?icon";
	import DeveloperGuide from "@material-symbols/svg-400/rounded/developer_guide.svg?icon";
	import ScrapLogo from "@scrap/assets/svgs/scrap.svg?icon";
	import Commit from "@material-symbols/svg-400/rounded/commit.svg?icon";
	import Button from "@scrap/components/controls/Button.svelte";
	import SoundTab from "@scrap/components/parts/SoundTab.svelte";
	import CostumeTab from "@scrap/components/parts/CostumeTab.svelte";
	import OutputPanel, {saveIntoZip} from "@scrap/components/parts/OutputPanel.svelte";
	import packageJSON from "../../package.json";
	import {saveAs} from "file-saver";
	import JSZip from "jszip";
	import * as SemVer from "semver-parser";
	import {assert} from "@scrap/utils/assert";
	import {Entity} from "@scrap/types/Enity.svelte";
	import {EntityAsset} from "@scrap/types/EntityAsset.svelte";
	import SpeedDial from "@scrap/components/controls/SpeedDial.svelte";
	import Dropdown from "@scrap/components/controls/Dropdown.svelte";
	import Screw from "@material-symbols/svg-400/rounded/home_improvement_and_tools-fill.svg?icon";
	import SB3 from "@scrap/code-transformers/sb3.ts";

	async function uploadNewEntity() {
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

		const asset = EntityAsset.fromFile(file);
		const sprite = Entity.createSprite(asset.name, asset);

		app.entities.push(sprite);
	}

	function createNewScrappy() {
		let name = "Scrappy";

		for (let i = 1; app.entities.some(entity => entity.name === name); i++) {
			name = `Scrappy (${i})`;
		}

		app.entities.push(Entity.createSprite(name));
	}

	type ProjectJSON = {
		entities: ReturnType<Entity["saveIntoZip"]>[];
		version: string;
		name: string;
		size: number;
	};

	const sb3 = SB3.new();

	async function saveScrap() {
		try {
			const zip = new JSZip();
			const entities = app.entities.map(e => e.saveIntoZip(zip));
			const state: ProjectJSON = {
				entities,
				version: packageJSON.version,
				name: app.name,
				size: app.size,
			};
			zip.file("project.json", JSON.stringify(state));

			saveAs(await zip.generateAsync({type: "blob"}), "project-saved.scrap");
		} catch (e) {
			console.error(e);
			app.dialog.fire({
				title: "Something went wrong...",
				body: String(e),
			});
		}
	}

	async function openScrap() {
		try {
			const filelist = await app.dialog.fire({
				type: "file",
				body: selectScrapFile,
				inputOptions: {
					accept: ".scrap",
				},
				title: "Open project...",
			});

			const file = filelist && filelist.item(0);

			if (!file) {
				return;
			}

			const zip = await JSZip.loadAsync(file);

			const project: ProjectJSON = JSON.parse(
				(await zip.file("project.json")?.async("string")) ?? "",
			);

			const projectVersion = await SemVer.promises.parseSemVer(project.version, true);
			const currentVersion = await SemVer.promises.parseSemVer(packageJSON.version, true);
			assert(
				projectVersion.major === currentVersion.major,
				"Project comes from an incompatible version of Scrap",
			);

			app.entities = await Promise.all(
				project.entities.map(Entity.loadFromState.bind(Entity, zip)),
			);

			app.size = project.size;
			app.name = project.name;
		} catch (e) {
			console.error(e);
			app.dialog.fire({
				title: "Something went wrong...",
				body: String(e),
			});
		}
	}

	async function openSB3() {
		try {
			const filelist = await app.dialog.fire({
				type: "file",
				body: selectSB3File,
				inputOptions: {
					accept: ".sb3",
				},
				title: "Open project...",
			});

			const file = filelist && filelist.item(0);

			if (!file) {
				return;
			}

			await sb3(await JSZip.loadAsync(file));
		} catch (e) {
			console.error(e);
			app.dialog.fire({
				title: "Something went wrong...",
				body: String(e),
			});
		}
	}

	export async function exportAsHTML() {
		try {
			const zip = new JSZip();
			const folder = zip.folder("project-export");
			assert(folder, "Fatal error when creating zip.");
			await saveIntoZip(folder);
			saveAs(await zip.generateAsync({type: "blob"}), "project-export.zip");
		} catch (e) {
			console.error(e);
			app.dialog.fire({
				title: "Something went wrong...",
				body: String(e),
			});
		}
	}
</script>

{#snippet selectScrapFile()}
	Select the <code class="inline-code">.scrap</code> file.
{/snippet}

{#snippet selectSB3File()}
	Select the <code class="inline-code">.sb3</code> file.
{/snippet}

<main class="h-screen overflow-hidden bg-base-200 text-base-content flex flex-col">
	<nav class="navbar bg-base-100">
		<div class="navbar-start">
			<Dropdown>
				{#snippet button()}
					<Button variant="ghost">
						<ScrapLogo class="h-8" />
					</Button>
				{/snippet}
				{#snippet content()}
					<li>
						<a href="/" class="leading-5">
							<Home class="size-5 fill-current" />
							Homepage
						</a>
					</li>
					<li>
						<a href="/docs" class="leading-5">
							<DeveloperGuide class="size-5 fill-current" />
							Docs
						</a>
					</li>
					<li>
						<a href={packageJSON.repository.url} class="leading-5">
							<Commit class="size-5 fill-current" />
							Repository
						</a>
					</li>
				{/snippet}
			</Dropdown>
			<Dropdown>
				{#snippet button()}
					<Button variant="ghost">File</Button>
				{/snippet}
				{#snippet content()}
					<li>
						<button type="button" onclick={saveScrap}>Save</button>
					</li>
					<li>
						<button type="button" onclick={openScrap}>Open</button>
					</li>
					<li class="border-t border-base-content/25">
						<button type="button" onclick={exportAsHTML}>Export as HTML</button>
					</li>
					<li>
						<button type="button" onclick={openSB3}>Import SB3</button>
					</li>
				{/snippet}
			</Dropdown>
		</div>
		<div class="navbar-center">
			<input
				type="text"
				placeholder="Project name..."
				class="input"
				bind:value={app.name}
			/>
		</div>
		<div class="navbar-end"></div>
	</nav>
	<div class="flex grow h-full">
		<CodePanel>
			<CostumeTab />
			<SoundTab />
		</CodePanel>
		<OutputPanel />
		<SpeedDial>
			<Button variant="fab" onclick={uploadNewEntity} title="Upload new costume">
				<Upload class="w-6 fill-current" />
			</Button>
			<Button variant="fab" onclick={createNewScrappy} title="Add new Scrappy sprite">
				<Screw class="w-6 fill-current" />
			</Button>
		</SpeedDial>
	</div>
</main>
