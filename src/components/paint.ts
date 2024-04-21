import {Brush, Line, Rectangle, Ellipse, Eraser, Fill, type Tool, Triangle, Select} from "./tools";
import Component from "./tab";
import {MediaList} from "./media-list";
import {bind} from "../decorators";
import "./paint.scss";

export default class Paint implements Component {
	context: CanvasRenderingContext2D;
	container = document.createElement("div");
	canvas = document.createElement("canvas");
	canvasContainer = document.createElement("div");
	toolContainer = document.createElement("div");
	controls = document.createElement("div");
	layer = document.createElement("canvas");
	seperator = document.createElement("div");
	cancelButton = document.createElement("button");
	saveButton = document.createElement("button");
	currentTool?: Tool;
	mouseDown = false;
	changed?: boolean;
	mediaList?: MediaList;
	file?: File;

	name = "Costumes";

	cropWorker = new Worker(new URL("./assets/crop.worker.ts", import.meta.url));

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
	mouseMove(e: MouseEvent) {
		const bbox = this.canvas.getBoundingClientRect();
		if (this.currentTool && this.mouseDown) {
			this.currentTool.step(e.pageX - bbox.left - window.scrollX, e.pageY - bbox.top - window.scrollY);
		}
	}

	@bind
	mouseUp() {
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

					canvas.getContext("2d")!.drawImage(
						this.layer,
						x,
						y,
						width,
						height,
						0,
						0,
						width,
						height
					);
					canvas.style.position = "absolute";
					canvas.style.left = x + "px";
					canvas.style.top = y + "px";
					canvas.style.outline = "3px dashed #575E75";

					const bbox = this.canvas.getBoundingClientRect();

					let startX = 0, startY = 0;
					const mouseDown = (e: MouseEvent) => {
						document.removeEventListener("mousedown", mouseDown);
						if (e.target !== canvas) {
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

					function mouseMove(e: MouseEvent) {
						const x = e.pageX - bbox.left - window.scrollX - startX;
						const y = e.pageY - bbox.top - window.scrollY - startY;

						// Make sure the image doesn't go out of bounds
						let clipLeft = 0, clipTop = 0, clipRight = 0, clipBottom = 0;

						if (x < 0) {
							clipLeft = -x;
						}

						if (x + canvas.width > bbox.width) {
							clipRight = x + canvas.width - bbox.width;
						}

						if (y < 0) {
							clipTop = -y;
						}

						if (y + canvas.height > bbox.height) {
							clipBottom = y + canvas.height - bbox.height;
						}

						if (clipLeft || clipTop || clipRight || clipBottom) {
							canvas.style.clipPath = `inset(${clipTop - 3}px ${clipRight - 3}px ${clipBottom - 3}px ${clipLeft - 3}px)`;
						} else {
							canvas.style.clipPath = "unset";
						}

						canvas.style.left = x + "px";
						canvas.style.top = y + "px";
					}

					function mouseUp() {
						document.removeEventListener("mousemove", mouseMove);
						document.removeEventListener("mouseup", mouseUp);
						document.addEventListener("mousedown", mouseDown);
					};

					document.addEventListener("mousedown", mouseDown);
					this.canvasContainer.appendChild(canvas);
				}

				this.layer.getContext("2d")!.clearRect(0, 0, this.layer.width, this.layer.height);
				this.canvasContainer.removeChild(this.layer);
			} else {
				this.setChanged(true);
			}
		}
	}

	async load(file: File) {
		app.showLoader("Loading costume");
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
		window.setTimeout(app.hideLoader, 100);
	}

	crop() {
		return new Promise<HTMLCanvasElement>((resolve, reject) => {
			this.cropWorker.onmessage = e => {
				const canvas = document.createElement("canvas");
				const {width, height, x, y} = e.data;
				canvas.width = width;
				canvas.height = height;
				canvas.getContext("2d")!.putImageData(this.context.getImageData(x, y, width, height), 0, 0);

				resolve(canvas);
			};
			this.cropWorker.onerror = reject;
			this.cropWorker.postMessage({
				imageData: this.context.getImageData(0, 0, this.canvas.width, this.canvas.height),
				width: this.canvas.width,
				height: this.canvas.height
			});
		});
	}

	async save(name: string) {
		if (!name.endsWith(".png")) {
			name += ".png";
		}
		const canvas = await this.crop();
		return new Promise<File>((resolve, reject) => {
			canvas.toBlob(blob => {
				if (!blob) {
					reject();
				} else {
					resolve(new File([blob], name, {type: "image/png"}));
				}
			});
		});
	}

	addTool(tool: Tool) {
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

	render() {
		this.update();
		app.container.appendChild(this.container);
	}

	setChanged(changed: boolean) {
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

	dispose() {
		this.mediaList?.dispose();
		delete this.mediaList;
		this.container.remove();
		this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
		document.removeEventListener("mousemove", this.mouseMove);
		document.removeEventListener("mouseup", this.mouseUp);
	}

	update() {
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
			const {detail: {file, name}} = e as CustomEvent<{file: File, name: string}>;
			app.current.costumes[app.current.costumes.indexOf(file)] = new File([file], name, {type: file.type});
		});

		this.mediaList.render(this.container);

		this.load(app.current.costumes[0]);

		this.saveButton.onclick = async () => {
			if (this.changed && this.file) {
				app.showLoader("Saving costume");
				this.setChanged(false);
				const file = await this.save(this.file.name);
				const index = app.current.costumes.indexOf(this.file);

				if (index === -1) {
					throw new Error("Costume not found");
				}

				app.current.costumes[index] = file;
				this.update();
				app.hideLoader();
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
}
