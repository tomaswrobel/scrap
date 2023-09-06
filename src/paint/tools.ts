import line from "./icons/line.svg";
import pen from "./icons/pen.svg";
import fill from "./icons/fill.svg";
import eraser from "./icons/eraser.svg";

/**
 * A tool that can be used to draw on the canvas.
 */
export abstract class Tool {
	/** The activation button */
	button = document.createElement("button");
	/** The canvas context used to draw on */
	ctx?: CanvasRenderingContext2D;

	startX?: number;
	startY?: number;

	/** Whether or not this tool requires a layer to be drawn on */
	needsLayer = true;

	readonly ICON_WIDTH = 24;
	readonly ICON_HEIGHT = 24;

	/**
	 * Selects this tool and returns an iterable of elements to be added to the tool container.
	 */
	abstract select(): IterableIterator<Node | string>;

	/**
	 * Finishes drawing on the canvas
	 * @param ctx The canvas context to merge the drawing into
	 */
	abstract end(ctx: CanvasRenderingContext2D): void;

	/**
	 * Draw on the canvas
	 * @param x current x position
	 * @param y current y position
	 */
	abstract step(x: number, y: number): void;

	/**
	 * Deselect this tool
	 */
	deselect() {
		this.button.classList.remove("selected");
	}

	/**
	 * Start drawing on the canvas. Subclasses should call this method.
	 * @param ctx The canvas context to draw on
	 * @param color The color to draw with
	 * @param x The starting x position
	 * @param y The starting y position
	 */
	start(ctx: CanvasRenderingContext2D, color: string, x: number, y: number): void {
		ctx.strokeStyle = color;
		ctx.fillStyle = color;

		this.startX = x;
		this.startY = y;
		this.ctx = ctx;
	}
}

/**
 * A tool that draws a shape on the canvas
 */
export abstract class ShapeTool extends Tool {
	/**
	 * When true, shape will be outlined. Otherwise, it will be filled.
	 */
	outline = false;

	constructor() {
		super();
		const shape = this.shape();
		shape.style.fill = "#575E75";
		this.button.appendChild(this.wrap(shape));
	}

	/**
	 * Wraps an SVG element in the SVGSVGElement
	 * @param svg The SVG element to warp in an SVG element
	 * @returns The SVG Root element
	 */
	private wrap(svg: SVGElement) {
		const root = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		root.setAttribute("viewBox", `0 0 ${this.ICON_WIDTH} ${this.ICON_HEIGHT}`);
		root.setAttribute("width", `${this.ICON_WIDTH}`);
		root.setAttribute("height", `${this.ICON_HEIGHT}`);
		root.appendChild(svg);
		return root;
	}

	*select() {
		this.button.classList.add("selected");

		const filled = document.createElement("button");
		filled.classList.add("selected");
		const filledShape = this.shape();
		filledShape.style.fill = "#575E75";
		filledShape.style.transform = "scale(0.9)";
		filledShape.style.transformOrigin = "center";

		const outline = document.createElement("button");
		const outlinedShape = this.shape();
		outlinedShape.style.stroke = "#575E75";
		outlinedShape.style.strokeWidth = "3";
		outlinedShape.style.fill = "none";
		outlinedShape.style.transform = "scale(0.9)";
		outlinedShape.style.transformOrigin = "center";

		outline.addEventListener("click", () => {
			filled.classList.remove("selected");
			outline.classList.add("selected");
			this.outline = true;
		});

		filled.addEventListener("click", () => {
			filled.classList.add("selected");
			outline.classList.remove("selected");
			this.outline = false;
		});

		filled.appendChild(this.wrap(filledShape));
		outline.appendChild(this.wrap(outlinedShape));

		yield filled;
		yield outline;
	}

	/**
	 * Merges the drawing into the canvas
	 * @param ctx The canvas context to draw on
	 */
	end(ctx: CanvasRenderingContext2D): void {
		ctx.drawImage(this.ctx!.canvas, 0, 0);
		delete this.ctx;
	}

	/**
	 * Returns the SVG element to be used as the icon for this tool.
	 */
	abstract shape(): SVGElement;
}

export abstract class DrawingTool extends Tool {
	width = 1;

	constructor(img: string) {
		super();
		const image = new Image(this.ICON_WIDTH, this.ICON_HEIGHT);
		image.src = img;
		this.button.appendChild(image);
	}

	*select() {
		this.button.classList.add("selected");

		const input = document.createElement("input");

		input.type = "range";
		input.min = "1";
		input.max = "10";
		input.value = this.width.toString();

		input.addEventListener("input", () => {
			this.width = Number.parseInt(input.value);
		});

		yield "Width: ";
		yield input;
	}

	start(ctx: CanvasRenderingContext2D, color: string, x: number, y: number) {
		super.start(ctx, color, x, y);
		ctx.lineWidth = this.width;
		ctx.lineCap = "round";
		ctx.lineJoin = "round";

		ctx.beginPath();
		ctx.moveTo(x, y);
	}

	end(ctx: CanvasRenderingContext2D) {
		ctx.drawImage(this.ctx!.canvas, 0, 0);
		delete this.ctx;
		delete this.startX;
		delete this.startY;
	}

	step(x: number, y: number): void {
		this.ctx!.lineTo(x, y);
		this.ctx!.stroke();
	}
}

export class Pen extends DrawingTool {
	constructor() {
		super(pen);
	}
}

export class Line extends DrawingTool {
	constructor() {
		super(line);
	}

	step(x: number, y: number) {
		this.ctx!.clearRect(0, 0, this.ctx!.canvas.width, this.ctx!.canvas.height);
		this.ctx!.beginPath();
		this.ctx!.moveTo(this.startX!, this.startY!);
		this.ctx!.lineTo(x, y);
		this.ctx!.stroke();
	}
}

export class Rectangle extends ShapeTool {
	shape() {
		const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
		rect.setAttribute("x", "0");
		rect.setAttribute("y", "0");
		rect.setAttribute("width", `${this.ICON_WIDTH}`);
		rect.setAttribute("height", `${this.ICON_HEIGHT}`);
		return rect;
	}
	step(x: number, y: number) {
		this.ctx!.clearRect(0, 0, this.ctx!.canvas.width, this.ctx!.canvas.height);

		if (this.outline) {
			this.ctx!.strokeRect(this.startX!, this.startY!, x - this.startX!, y - this.startY!);
		} else {
			this.ctx!.fillRect(this.startX!, this.startY!, x - this.startX!, y - this.startY!);
		}
	}
}

export class Ellipse extends ShapeTool {
	shape() {
		const ellipse = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
		ellipse.setAttribute("cx", `${this.ICON_WIDTH / 2}`);
		ellipse.setAttribute("cy", `${this.ICON_HEIGHT / 2}`);
		ellipse.setAttribute("rx", `${this.ICON_WIDTH / 2}`);
		ellipse.setAttribute("ry", `${this.ICON_HEIGHT / 2}`);
		return ellipse;
	}

	step(x: number, y: number) {
		this.ctx!.clearRect(0, 0, this.ctx!.canvas.width, this.ctx!.canvas.height);

		this.ctx!.beginPath();
		this.ctx!.ellipse(
			this.startX! + (x - this.startX!) / 2,
			this.startY! + (y - this.startY!) / 2,
			Math.abs(x - this.startX!) / 2,
			Math.abs(y - this.startY!) / 2,
			0,
			0,
			2 * Math.PI
		);

		this.ctx![this.outline ? "stroke" : "fill"]();
	}
}

export class Triangle extends ShapeTool {
	shape() {
		const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
		path.setAttribute(
			"d",
			`M ${this.ICON_WIDTH / 2} 0 L ${this.ICON_WIDTH} ${this.ICON_HEIGHT} L 0 ${this.ICON_HEIGHT} Z`
		);
		return path;
	}

	step(x: number, y: number) {
		this.ctx!.clearRect(0, 0, this.ctx!.canvas.width, this.ctx!.canvas.height);

		this.ctx!.beginPath();
		this.ctx!.moveTo(this.startX!, this.startY!);
		this.ctx!.lineTo(x, y);
		this.ctx!.lineTo(2 * this.startX! - x, y);
		this.ctx!.closePath();

		this.ctx![this.outline ? "stroke" : "fill"]();
	}
}

export class Fill extends Tool {
	lastX?: number;
	lastY?: number;
	color?: string;

	end(ctx: CanvasRenderingContext2D) {
		const data = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
		const {data: target} = ctx.getImageData(this.lastX!, this.lastY!, 1, 1);

		// ignore transparent pixels
		if (target[3] === 0) {
			return;
		}

		this.worker.postMessage({
			imageData: data,
			target,
			color: this.color,
			x: this.lastX,
			y: this.lastY,
		});
	}

	step(x: number, y: number): void {
		this.lastX = x;
		this.lastY = y;
	}

	start(ctx: CanvasRenderingContext2D, color: string, x: number, y: number): void {
		this.ctx = ctx;
		this.color = color;
		this.lastX = x;
		this.lastY = y;
	}

	*select() {
		this.button.classList.add("selected");
	}

	worker = new Worker(new URL("./fill.worker.ts", import.meta.url));

	constructor() {
		super();
		const img = new Image(this.ICON_WIDTH, this.ICON_HEIGHT);
		img.src = fill;
		this.button.appendChild(img);

		this.worker.onmessage = e => {
			this.ctx!.putImageData(e.data, 0, 0);
		};

		this.needsLayer = false;
	}
}

export class Eraser extends DrawingTool {
	step(x: number, y: number): void {
		this.ctx!.clearRect(x - this.width / 2, y - this.width / 2, this.width, this.width);
	}

	constructor() {
		super(eraser);
		// Modify the canvas directly
		this.needsLayer = false;
	}
}
