/**
 * This file is a part of Scrap Native, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomas-wrobel/scrap.
 *
 * @license MIT
 * @fileoverview Paint editor
 * @copyright Tomáš Wróbel 2025
 */
import {invoke} from "@tauri-apps/api/core";
import {bind, load} from "../utils/decorators";
import {MediaList} from "./media-list";
import "./paint.scss";
import type Component from "./tab";
import {Brush, Ellipse, Eraser, Fill, Line, Rectangle, Select, type Tool, Triangle} from "./tools";

export default class Paint implements Component {
	public context: CanvasRenderingContext2D;
	public container = document.createElement("div");
	public canvas = document.createElement("canvas");
	public canvasContainer = document.createElement("div");
	public toolContainer = document.createElement("div");
	public controls = document.createElement("div");
	public layer = document.createElement("canvas");
	public seperator = document.createElement("div");
	public cancelButton = document.createElement("button");
	public saveButton = document.createElement("button");
	public currentTool?: Tool;
	public mouseDown = false;
	public changed?: boolean;
	public mediaList?: MediaList;
	public file?: File;

	public name = "Costumes";

	constructor() {
		this.container.classList.add("paint", "tab-content");
		this.toolContainer.classList.add("tools");
		this.controls.classList.add("controls");
		this.canvasContainer.classList.add("canvas");

		this.context = this.canvas.getContext("2d", {
			willReadFrequently: true,
		})!;

		this.canvas.width = 480;
		this.canvas.height = 360;
		this.layer.width = this.canvas.width;
		this.layer.height = this.canvas.height;
		this.layer.style.pointerEvents = "none";

		this.addTool(new Select());
		this.addTool(new Brush());
		this.addTool(new Line());
		this.addTool(new Rectangle());
		this.addTool(new Ellipse());
		this.addTool(new Triangle());
		this.addTool(new Eraser());
		this.addTool(new Fill());

		const colorInput = document.createElement("input");
		colorInput.type = "color";
		colorInput.value = "#ff0000";
		colorInput.classList.add("color");

		const colorDiv = document.createElement("div");
		colorDiv.style.backgroundColor = "#ff0000";
		colorDiv.classList.add("color");

		colorInput.oninput = () => {
			colorDiv.style.backgroundColor = colorInput.value;
		};

		this.canvas.addEventListener("mousedown", e => {
			if (this.currentTool) {
				this.mouseDown = true;
				if (this.currentTool.movable) {
					this.canvasContainer.appendChild(this.layer);
					var ctx = this.layer.getContext("2d")!;
				} else {
					var ctx = this.context;
				}

				document.addEventListener("mousemove", this.mouseMove);
				document.addEventListener("mouseup", this.mouseUp);

				this.currentTool.start(ctx, colorInput.value, e.offsetX, e.offsetY);
			}
		});

		this.canvasContainer.appendChild(this.canvas);

		this.seperator.style.flex = "1";
		this.saveButton.textContent = "Save";
		this.saveButton.classList.add("selected");
		this.cancelButton.textContent = "Cancel";
		this.cancelButton.style.border = "1px solid #575E75";

		this.saveButton.style.aspectRatio = "unset";
		this.cancelButton.style.aspectRatio = "unset";
		this.saveButton.type = "button";
		this.cancelButton.type = "button";

		this.setChanged(false);

		this.container.append(this.toolContainer, this.canvasContainer, this.controls, colorInput, colorDiv);
	}

	@bind
	public mouseMove(e: MouseEvent) {
		const bbox = this.canvas.getBoundingClientRect();
		if (this.currentTool && this.mouseDown) {
			this.currentTool.step(e.pageX - bbox.left - window.scrollX, e.pageY - bbox.top - window.scrollY);
		}
	}

	@bind
	public mouseUp() {
		document.removeEventListener("mousemove", this.mouseMove);
		document.removeEventListener("mouseup", this.mouseUp);
		this.mouseDown = false;
		if (this.currentTool) {
			this.currentTool.end(this.context);
			if (this.currentTool.movable) {
				const width = Math.round(Math.abs(this.currentTool.lastX - this.currentTool.startX));
				const height = Math.round(Math.abs(this.currentTool.lastY - this.currentTool.startY));

				if (width && height) {
					const x = Math.round(Math.min(this.currentTool.lastX, this.currentTool.startX));
					const y = Math.round(Math.min(this.currentTool.lastY, this.currentTool.startY));

					const canvas = document.createElement("canvas");
					canvas.width = width;
					canvas.height = height;
					canvas.style.cursor = "move";

					canvas.getContext("2d")!.drawImage(this.layer, x, y, width, height, 0, 0, width, height);
					canvas.style.position = "absolute";
					canvas.style.left = `${x}px`;
					canvas.style.top = `${y}px`;
					canvas.style.outline = "3px dashed #575E75";

					const bbox = this.canvas.getBoundingClientRect();

					let startX = 0,
						startY = 0;

					const mouseDown = (e: MouseEvent) => {
						document.removeEventListener("mousedown", mouseDown);
						if (e.target !== canvas) {
							document.removeEventListener("keydown", keydown);
							const x = parseInt(canvas.style.left.replace("px", ""));
							const y = parseInt(canvas.style.top.replace("px", ""));

							this.canvasContainer.removeChild(canvas);
							this.context.drawImage(canvas, x, y);

							this.currentTool!.lastX = NaN;
							this.currentTool!.lastY = NaN;
							this.currentTool!.startX = NaN;
							this.currentTool!.startY = NaN;

							this.setChanged(true);
						} else {
							startX = e.offsetX;
							startY = e.offsetY;
							document.addEventListener("mousemove", mouseMove);
							document.addEventListener("mouseup", mouseUp);
						}
					};

					const mouseMove = function (e: MouseEvent) {
						const x = e.pageX - bbox.left - window.scrollX - startX;
						const y = e.pageY - bbox.top - window.scrollY - startY;

						// Make sure the image doesn't go out of bounds
						const clip = [
							x < 0 && -x,
							y < 0 && -y,
							x + canvas.width > bbox.width && x + canvas.width - bbox.width,
							y + canvas.height > bbox.height && y + canvas.height - bbox.height,
						];

						if (clip.some(Boolean)) {
							canvas.style.clipPath = `inset(${clip.map(v => `${v || 0}px`).join(" ")})`;
						} else {
							canvas.style.removeProperty("clip-path");
						}

						canvas.style.left = `${x}px`;
						canvas.style.top = `${y}px`;
					};

					const mouseUp = function () {
						document.removeEventListener("mousemove", mouseMove);
						document.removeEventListener("mouseup", mouseUp);
						document.addEventListener("mousedown", mouseDown);
					};

					const keydown = (e: KeyboardEvent) => {
						if (e.key === "Delete") {
							document.removeEventListener("mousemove", mouseMove);
							document.removeEventListener("mouseup", mouseUp);
							document.removeEventListener("mousedown", mouseDown);
							document.removeEventListener("keydown", keydown);

							this.canvasContainer.removeChild(canvas);
							this.currentTool!.lastX = NaN;
							this.currentTool!.lastY = NaN;
							this.currentTool!.startX = NaN;
							this.currentTool!.startY = NaN;
						}
					};

					document.addEventListener("mousedown", mouseDown);
					document.addEventListener("keydown", keydown);

					this.canvasContainer.appendChild(canvas);
				}

				this.layer.getContext("2d")!.clearRect(0, 0, this.layer.width, this.layer.height);
				this.canvasContainer.removeChild(this.layer);
			} else {
				this.setChanged(true);
			}
		}
	}

	@load("Loading costume")
	public async load(file: File) {
		const reader = new FileReader();
		this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

		await new Promise<void>((resolve, reject) => {
			reader.onload = () => {
				const image = new Image();
				image.onload = () => {
					if (app.current.isStage()) {
						this.context.drawImage(image, 0, 0, this.canvas.width, this.canvas.height);
					} else {
						// Center the image
						const x = (this.canvas.width - image.width) / 2;
						const y = (this.canvas.height - image.height) / 2;
						this.context.drawImage(image, x, y);
					}
					resolve();
				};
				image.src = reader.result as string;
			};
			reader.onerror = reject;
			reader.readAsDataURL(file);
		});

		this.file = file;
	}

	public addTool(tool: Tool) {
		const button = this.toolContainer.appendChild(tool.button);

		button.addEventListener("click", () => {
			this.controls.innerHTML = "";
			if (tool === this.currentTool) {
				this.currentTool = undefined;
				tool.deselect();
			} else {
				this.currentTool?.deselect();
				this.currentTool = tool;
				this.controls.append(...tool.select(), this.seperator, this.cancelButton, this.saveButton);
			}
		});
	}

	public render() {
		this.update();
		app.container.appendChild(this.container);
	}

	public setChanged(changed: boolean) {
		if ((this.changed = changed)) {
			this.cancelButton.style.opacity = "1";
			this.saveButton.style.opacity = "1";
			this.saveButton.style.cursor = "pointer";
		} else {
			this.cancelButton.style.opacity = "0.5";
			this.saveButton.style.opacity = "0.5";
			this.saveButton.style.cursor = "default";
		}
	}

	public dispose() {
		this.mediaList?.dispose();
		delete this.mediaList;
		this.container.remove();
		this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
		document.removeEventListener("mousemove", this.mouseMove);
		document.removeEventListener("mouseup", this.mouseUp);
	}

	public update() {
		this.mediaList?.dispose();

		this.mediaList = new MediaList(MediaList.COSTUME, app.current.costumes);

		this.mediaList.addEventListener("select", async e => {
			const {detail: file} = e as CustomEvent<File>;
			app.current.current = app.current.costumes.indexOf(file);
			app.current.update();
			await this.load((e as CustomEvent<File>).detail);
			this.setChanged(false);
		});

		this.mediaList.addEventListener("rename", e => {
			const {
				detail: {file, name},
			} = e as CustomEvent<{file: File; name: string}>;
			app.current.costumes[app.current.costumes.indexOf(file)] = new File([file], name, {type: file.type});
		});

		this.mediaList.render(this.container);

		this.load(app.current.costumes[0]);

		this.saveButton.onclick = () => {
			if (this.changed) {
				this.setChanged(false);
				this.save();
			}
		};

		this.cancelButton.onclick = () => {
			if (this.changed) {
				this.setChanged(false);
				this.load(app.current.costumes[app.current.current]);
			}
		};

		app.current.update();
	}

	@load("Saving costume")
	public async save() {
		const file = await invoke<[number, number, number, number]>("crop", {
			imageData: Array.from(this.context.getImageData(0, 0, this.canvas.width, this.canvas.height).data),
			width: this.canvas.width,
			height: this.canvas.height,
		}).then(xywh => {
			const canvas = document.createElement("canvas");
			const data = this.context.getImageData(...xywh);
			({width: canvas.width, height: canvas.height} = data);
			canvas.getContext("2d")!.putImageData(data, 0, 0);

			return new Promise<File>((resolve, reject) => {
				canvas.toBlob(blob => {
					if (!blob) {
						reject();
					} else {
						resolve(new File([blob], this.file!.name, {type: "image/png"}));
					}
				});
			});
		});

		app.current.costumes[app.current.costumes.indexOf(this.file!)] = file;
		this.update();
	}
}
