import {Pen, Line, Rectangle, Ellipse, Eraser, Fill, type Tool, Triangle} from "../paint/tools";
import CropWorker from "./crop.ts?worker";
import type {Entity} from "../entities";
import Component from "../tab";
import "./paint.scss";

export default class Paint implements Component {
	context: CanvasRenderingContext2D;
	container = document.createElement("div");
	canvas = document.createElement("canvas");
	canvasContainer = document.createElement("div");
	toolContainer = document.createElement("div");
	controls = document.createElement("div");
	layer = document.createElement("canvas");
	lookContainer = document.createElement("div");
	seperator = document.createElement("div");
	cancelButton = document.createElement("button");
	saveButton = document.createElement("button");
	currentTool?: Tool;
	mouseDown = false;
	changed!: boolean;

	cropWorker = new CropWorker();

	constructor() {
		this.container.classList.add("paint", "tab-content");
		this.toolContainer.classList.add("tools");
		this.controls.classList.add("controls");
		this.lookContainer.classList.add("looks");
		this.canvasContainer.classList.add("canvas");

		this.context = this.canvas.getContext("2d", {
			willReadFrequently: true,
		})!;

		this.canvas.width = 480;
		this.canvas.height = 360;
		this.layer.width = this.canvas.width;
		this.layer.height = this.canvas.height;
		this.layer.style.pointerEvents = "none";

		this.addTool(new Pen());
		this.addTool(new Line());
		this.addTool(new Rectangle());
		this.addTool(new Ellipse());
		this.addTool(new Triangle());
		this.addTool(new Eraser());
		this.addTool(new Fill());

		const colorInput = document.createElement("input");
		colorInput.type = "color";

		this.mouseMove = this.mouseMove.bind(this);
		this.mouseUp = this.mouseUp.bind(this);

		this.canvas.addEventListener("mousedown", e => {
			if (this.currentTool) {
				this.mouseDown = true;
				if (this.currentTool.needsLayer) {
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

		this.setChanged(false);

		this.container.append(this.toolContainer, this.canvasContainer, this.controls, this.lookContainer, colorInput);
	}

	mouseMove(e: MouseEvent) {
		const bbox = this.canvas.getBoundingClientRect();
		if (this.currentTool && this.mouseDown) {
			this.currentTool.step(e.pageX - bbox.left - window.scrollX, e.pageY - bbox.top - window.scrollY);
		}
	}

	mouseUp() {
		this.mouseDown = false;
		if (this.currentTool) {
			this.currentTool.end(this.context);
			if (this.currentTool.needsLayer) {
				this.layer.getContext("2d")!.clearRect(0, 0, this.layer.width, this.layer.height);
				this.canvasContainer.removeChild(this.layer);
			}
		}
		this.setChanged(true);
		document.removeEventListener("mousemove", this.mouseMove);
		document.removeEventListener("mouseup", this.mouseUp);
	}

	load(file: File) {
		const reader = new FileReader();
		this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

		return new Promise<void>((resolve, reject) => {
			reader.onload = () => {
				const image = new Image();
				image.onload = () => {
					// Center the image
					const x = (this.canvas.width - image.width) / 2;
					const y = (this.canvas.height - image.height) / 2;
					this.context.drawImage(image, x, y);
					resolve();
				};
				image.src = reader.result as string;
			};
			reader.onerror = reject;
			reader.readAsDataURL(file);
		});
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

	render(entity: Entity, element: Element) {
		this.update(entity);
		element.appendChild(this.container);

		const label = document.createElement("label");
		label.textContent = "+";
		label.style.gridArea = "looks";
		label.classList.add("fab");

		const input = document.createElement("input");
		input.style.display = "none";
		input.type = "file";
		input.accept = "image/*";

		input.addEventListener("change", () => {
			if (input.files) {
				entity.costumes.push(...input.files);
				this.update(entity);
			}
		});

		label.style.lineHeight = "50px";
		label.style.textAlign = "center";
		label.style.font = "20px sans-serif bold";

		label.appendChild(input);
		this.container.appendChild(label);
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
		this.lookContainer.innerHTML = "";
		this.container.remove();
		this.container.querySelector("label")!.remove();
		this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
		document.removeEventListener("mousemove", this.mouseMove);
		document.removeEventListener("mouseup", this.mouseUp);
	}

	update(entity: Entity) {
		this.lookContainer.innerHTML = "";
		this.load(entity.costumes[entity.currentCostume]);

		this.saveButton.onclick = async () => {
			if (this.changed) {
				this.setChanged(false);
				const file = await this.save(entity.costumes[entity.currentCostume].name);
				entity.costumes[entity.currentCostume] = file;
				this.update(entity);
			}
		};

		this.cancelButton.onclick = () => {
			if (this.changed) {
				this.setChanged(false);
				this.load(entity.costumes[entity.currentCostume]);
			}
		};

		for (const file of entity.costumes) {
			const img = new Image(60, 60);
			img.src = URL.createObjectURL(file);

			const costume = document.createElement("div");
			costume.classList.add("sprite");
			const name = document.createElement("span");
			name.textContent = file.name;
			name.classList.add("name");
			costume.append(img, name);

			if (file === entity.costumes[entity.currentCostume]) {
				costume.classList.add("selected");
			}

			costume.addEventListener("click", () => {
				entity.currentCostume = entity.costumes.indexOf(file);
				this.update(entity);
			});

			this.lookContainer.appendChild(costume);
		}

		entity.update();
	}
}
