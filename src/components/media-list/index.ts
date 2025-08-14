/**
 * This file is a part of Scrap Native, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomas-wrobel/scrap.
 *
 * @license MIT
 * @fileoverview Media list component
 * @copyright Tomáš Wróbel 2025
 */
import {Menu, MenuItem} from "@tauri-apps/api/menu";
import {LogicalPosition} from "@tauri-apps/api/dpi";
import Note from "@scrap/assets/svgs/note.svg";
import * as path from "path";
import "./style.scss";

/**
 * A common component for managing costume and
 * sound lists in the paint and sound editors.
 *
 * It handles drag and drop, renaming, and removal.
 */
export class MediaList extends EventTarget {
	private readonly root = document.createElement("div");
	private readonly fab = document.createElement("label");

	constructor(public type: MediaType, public files: File[]) {
		super();

		this.root.classList.add("media-list");
		this.root.style.gridArea = type.gridArea;

		this.fab.classList.add("fab");
		this.fab.textContent = "+";
		this.fab.title = "Upload media...";
		this.fab.style.gridArea = type.gridArea;

		const input = document.createElement("input");
		input.type = "file";
		input.accept = `${type.accept}`;

		input.multiple = true;
		input.style.display = "none";

		input.addEventListener("change", () => {
			if (input.files) {
				this.addFiles(input.files);
			}
		});

		// Drag and drop
		this.root.addEventListener("dragover", event => {
			event.preventDefault();
		});

		this.root.addEventListener("drop", event => {
			event.preventDefault();
			if (event.dataTransfer) {
				this.addFiles(event.dataTransfer.files);
			}
		});

		this.fab.appendChild(input);
	}

	public render(parent: Element) {
		parent.append(this.root, this.fab);
		for (let i = 0; i < this.files.length; i++) {
			this.createMediaElement(this.files[i]);
		}

		const first = this.root.querySelector(".media-element");
		if (first) {
			first.classList.add("selected");
		}
	}

	private addFiles(files: FileList) {
		for (const file of files) {
			if (this.type.accept.indexOf(file.type) !== -1) {
				this.files.push(file);
				this.createMediaElement(file);
			}
		}
	}

	private createMediaElement(file: File) {
		const {name, ext} = path.parse(file.name);
		const element = document.createElement("div");
		element.classList.add("media-element");

		const img = new Image();
		img.src = this.type.getURLFor(file);
		element.appendChild(img);

		const span = document.createElement("span");
		span.classList.add("name");
		span.textContent = name;

		const input = document.createElement("input");
		input.classList.add("name");

		function rename() {
			input.value = span.textContent!;
			element.replaceChild(input, span);
			input.focus();
			input.select();
		}

		span.ondblclick = rename;

		input.onkeyup = e => {
			if (e.key === "Enter") {
				input.blur();
			} else if (e.key === "Escape") {
				e.preventDefault();
				input.value = span.textContent!;
				input.blur();
			}
		};

		input.onblur = () => {
			const invalid = /[/\\?%*:|"<>]/g; // Invalid characters
			const reserved = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i; // Windows reserved names
			let name = input.value.trim();

			if (reserved.test(name)) {
				name = "";
			} else {
				name = name.trim().replace(invalid, "");
			}

			name = name || span.textContent;

			if (name !== span.textContent) {
				this.dispatchEvent(
					new CustomEvent("rename", {
						detail: {
							file,
							name: name + ext,
						},
					})
				);
			}

			span.textContent = name;
			element.replaceChild(span, input);
		};

		element.appendChild(span);

		const removeButton = document.createElement("div");
		removeButton.classList.add("remove");
		element.appendChild(removeButton);

		element.onclick = e => {
			if (e.target === removeButton) {
				this.removeElement(file, element);
			} else if (e.target !== span && e.target !== input) {
				for (const child of this.root.getElementsByClassName("selected")) {
					child.classList.remove("selected");
				}

				element.classList.add("selected");
				this.dispatchEvent(new CustomEvent("select", {detail: file}));
			}
		};

		element.oncontextmenu = async e => {
			e.preventDefault();

			const menu = await Menu.new({
				items: [
					await MenuItem.new({
						text: "Rename",
						enabled: true,
						action: rename,
					}),
					await MenuItem.new({
						text: "Delete",
						enabled: this.files.length > 1,
						action: () => this.removeElement(file, element),
					}),
				],
			});

			menu.popup(new LogicalPosition(e.clientX, e.clientY));
		};

		this.root.appendChild(element);
	}

	private removeElement(file: File, element: Element) {
		element.remove();
		this.files.splice(this.files.indexOf(file), 1);
		this.dispatchEvent(new CustomEvent("select", {detail: this.files[0]}));

		for (const child of this.root.getElementsByClassName("selected")) {
			child.classList.remove("selected");
		}

		this.root.querySelector(".media-element")!.classList.add("selected");
	}

	public dispose() {
		this.root.innerHTML = "";
		this.root.remove();
		this.fab.remove();
	}

	public static readonly COSTUME: MediaType = {
		getURLFor(file: File) {
			return URL.createObjectURL(file);
		},
		accept: ["image/png", "image/jpeg", "image/svg+xml"],
		gridArea: "costume",
	};

	public static readonly SOUND: MediaType = {
		getURLFor() {
			return Note;
		},
		accept: ["audio/mpeg", "audio/ogg", "audio/wav"],
		gridArea: "sound",
	};
}

export interface MediaType {
	getURLFor(file: File): string;
	accept: string[];
	gridArea: string;
}
