import WaveSurfer from "wavesurfer.js";
import TabComponent from "../tab";
import "./sounds.scss";
import {MediaList} from "../media-list";

export default class Sound implements TabComponent {
	container = document.createElement("div");
	waves = document.createElement("div");
	wavesurfer = WaveSurfer.create({
		container: this.waves,
		waveColor: "hsl(300, 54%, 72%)",
		normalize: true,
		height: "auto",
	});
	name = "Sounds";
	current?: number;
	mediaList?: MediaList;

	constructor() {
		this.container.classList.add("sound", "tab-content");
		this.container.appendChild(this.waves);
		this.waves.classList.add("waves");
		this.wavesurfer.on("interaction", () => {
			this.wavesurfer.playPause();
		});
	}

	render() {
		window.app.container.appendChild(this.container);
		this.update();
	}

	update() {
		this.mediaList?.dispose();
		this.wavesurfer.loadBlob(window.app.current.sounds[0]);
		this.mediaList = new MediaList(MediaList.SOUND, window.app.current.sounds);

		this.mediaList.addEventListener("select", async e => {
			const {detail: file} = e as CustomEvent<File>;
			this.wavesurfer.loadBlob(file);
		});

		this.mediaList.render(this.container);
	}

	dispose() {
		this.mediaList?.dispose();
		this.container.remove();
	}
}
