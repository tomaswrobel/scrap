/**
 * This file is a part of Scrap Native, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomas-wrobel/scrap.
 *
 * @license MIT
 * @copyright Tomáš Wróbel 2024
 * @fileoverview Sound preview component.
 *
 * Unfortunately, Scrap does not support sound editing yet. This component
 * is a placeholder for future development. It allows the user to preview
 * the sound files and play them only.
 */
import WaveSurfer from "wavesurfer.js";
import type TabComponent from "./tab";
import {MediaList} from "./media-list";
import "./sounds.scss";

export default class Sound implements TabComponent {
	public readonly container = document.createElement("div");
	public readonly waves = document.createElement("div");
	private wavesurfer = WaveSurfer.create({
		container: this.waves,
		waveColor: "hsl(300, 54%, 72%)",
		normalize: true,
		height: "auto",
	});
	public name = "Sounds";
	public current?: number;
	private mediaList?: MediaList;

	constructor() {
		this.container.classList.add("sound", "tab-content");
		this.container.appendChild(this.waves);
		this.waves.classList.add("waves");
		this.wavesurfer.on("interaction", () => {
			this.wavesurfer.playPause();
		});
	}

	public render() {
		app.container.appendChild(this.container);
		this.update();
	}

	public update() {
		this.mediaList?.dispose();
		this.wavesurfer.loadBlob(app.current.sounds[0]);
		this.mediaList = new MediaList(MediaList.SOUND, app.current.sounds);

		this.mediaList.addEventListener("select", e => {
			const {detail: file} = e as CustomEvent<File>;
			this.wavesurfer.loadBlob(file);
		});

		this.mediaList.addEventListener("rename", e => {
			const {
				detail: {file, name},
			} = e as CustomEvent<{file: File; name: string}>;
			const index = app.current.sounds.indexOf(file);
			app.current.sounds[index] = new File([file], name, {type: file.type});
		});

		this.mediaList.render(this.container);
	}

	public dispose() {
		this.mediaList?.dispose();
		this.container.remove();
	}
}
