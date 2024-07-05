/**
 * This file is a part of Scrap, an educational programming language.
 * You should have received a copy of the MIT License, if not, please 
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomas-wrobel/scrap. 
 * 
 * @license MIT
 * @author Tomáš Wróbel
 * @fileoverview Tools for drawing on the canvas in the paint editor.
 */
import line from "./icons/line.svg";
import brush from "./icons/brush.svg";
import fill from "./icons/fill.svg";
import eraser from "./icons/eraser.svg";
import marquee from "./icons/marquee.svg";

/**
 * A tool that can be used to draw on the canvas.
 */
export abstract class Tool {
	/** The activation button */
	button = document.createElement("button");
	/** The canvas context used to draw on */
	ctx?: CanvasRenderingContext2D;

	startX = NaN;
	startY = NaN;
	lastX = NaN;
	lastY = NaN;
	width = 1;

	/** 
	 * Whether or not this tool requires a layer to be drawn on.
	 *
	 * If true, the layer will be created when this tool is selected.
	 * After the tool ends, the layer becomes movable.
	 * 
	 * If false, the tool will draw directly on the canvas.
	 */
	movable = true;

	readonly ICON_WIDTH = 24;
	readonly ICON_HEIGHT = 24;

	/**
	 * Selects this tool and returns an iterable of elements to be added to the tool container.
	 */
	*select(): Generator<Node> {
		this.button.classList.add("selected");

		const input = document.createElement("input");

		input.type = "range";
		input.min = "1";
		input.max = "20";
		input.id = "width";
		input.style.setProperty("--min", "1");
		input.style.setProperty("--max", "20");
		input.value = this.width.toString();
		input.style.setProperty("--value", input.value);
		const unit = document.createElement("span");
		unit.classList.add("unit");
		unit.textContent = input.value;

		input.addEventListener("input", () => {
			input.style.setProperty("--value", input.value);
			this.width = Number.parseInt(input.value);
			unit.textContent = input.value;
		});

		const label = document.createElement("span");
		label.textContent = "Stroke width: ";

		yield label;
		yield input;
		yield unit;
	}

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
	step(x: number, y: number) {
		this.lastX = x;
		this.lastY = y;
	}

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
	start(ctx: CanvasRenderingContext2D, color: string, x: number, y: number) {
		ctx.strokeStyle = color;
		ctx.fillStyle = color;

		this.startX = x;
		this.startY = y;
		this.ctx = ctx;
	}

	constructor(title: string, img?: Pick<HTMLImageElement, "alt" | "src">) {
		this.button.type = "button";
		this.button.title = title;

		img && this.button.appendChild(
			Object.assign(
				new Image(this.ICON_WIDTH, this.ICON_HEIGHT),
				img
			)
		);
	}
}

export abstract class DrawingTool extends Tool {
	width = 1;

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

		this.startX = NaN;
		this.startY = NaN;
		this.lastX = NaN;
		this.lastY = NaN;
		this.ctx = undefined;
	}

	step(x: number, y: number) {
		super.step(x, y);
		this.ctx!.lineTo(x, y);
		this.ctx!.stroke();
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

	constructor(title: string) {
		super(title);
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

	*select(): Generator<Node> {
		this.button.classList.add("selected");

		const filled = document.createElement("button");
		filled.classList.add("selected", "fill", "shape-button");
		filled.type = "button";
		filled.title = "Filled";

		const outline = document.createElement("button");
		outline.classList.add("outline", "shape-button");
		outline.type = "button";
		outline.title = "Outlined";

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

		filled.appendChild(this.wrap(this.shape()));
		outline.appendChild(this.wrap(this.shape()));

		yield filled;
		yield outline;
		yield* super.select();
	}

	start(ctx: CanvasRenderingContext2D, color: string, x: number, y: number) {
		super.start(ctx, color, x, y);
		ctx.lineCap = "square";
		ctx.lineJoin = "miter";
		ctx.closePath();
	}

	/**
	 * Merges the drawing into the canvas
	 * @param ctx The canvas context to draw on
	 */
	end(_ctx: CanvasRenderingContext2D) {
		// Actually, since my shape is drawn when the moving ends,
		// I don't need to do anything here.
	}

	/**
	 * Returns the SVG element to be used as the icon for this tool.
	 */
	abstract shape(): SVGElement;
}

export class Brush extends DrawingTool {
	constructor() {
		super("Draw freely", {
			src: brush,
			alt: "Brush"
		});
	}
}

export class Line extends Tool {
	constructor() {
		super("Draw straight lines", {
			src: line,
			alt: "Line"
		});
	}

	step(x: number, y: number) {
		this.lastX = x;
		this.lastY = y;

		this.ctx!.clearRect(0, 0, this.ctx!.canvas.width, this.ctx!.canvas.height);
		this.ctx!.beginPath();
		this.ctx!.moveTo(this.startX, this.startY);
		this.ctx!.lineTo(this.lastX, this.lastY);
		this.ctx!.stroke();
	}

	end(_ctx: CanvasRenderingContext2D) {}
}

export class Rectangle extends ShapeTool {
	constructor() {
		super("Draw rectangles.");
	}
	shape() {
		const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
		rect.setAttribute("x", "0");
		rect.setAttribute("y", "0");
		rect.setAttribute("width", `${this.ICON_WIDTH}`);
		rect.setAttribute("height", `${this.ICON_HEIGHT}`);
		return rect;
	}
	step(x: number, y: number) {
		super.step(x, y);
		this.ctx!.clearRect(0, 0, this.ctx!.canvas.width, this.ctx!.canvas.height);

		if (this.outline) {
			this.ctx!.strokeRect(this.startX, this.startY, x - this.startX, y - this.startY);
		} else {
			this.ctx!.fillRect(this.startX, this.startY, x - this.startX, y - this.startY);
		}
	}
}

export class Ellipse extends ShapeTool {
	constructor() {
		super("Draw ellipses.");
	}

	shape() {
		const ellipse = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
		ellipse.setAttribute("cx", `${this.ICON_WIDTH / 2}`);
		ellipse.setAttribute("cy", `${this.ICON_HEIGHT / 2}`);
		ellipse.setAttribute("rx", `${this.ICON_WIDTH / 2}`);
		ellipse.setAttribute("ry", `${this.ICON_HEIGHT / 2}`);
		return ellipse;
	}

	step(x: number, y: number) {
		super.step(x, y);
		this.ctx!.clearRect(0, 0, this.ctx!.canvas.width, this.ctx!.canvas.height);

		this.ctx!.beginPath();
		this.ctx!.ellipse(
			this.startX + (x - this.startX) / 2,
			this.startY + (y - this.startY) / 2,
			Math.abs(x - this.startX) / 2,
			Math.abs(y - this.startY) / 2,
			0,
			0,
			2 * Math.PI
		);

		this.ctx![this.outline ? "stroke" : "fill"]();
	}
}

export class Triangle extends ShapeTool {
	constructor() {
		super("Draw triangles.");
	}

	shape() {
		const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
		path.setAttribute(
			"d",
			`M ${this.ICON_WIDTH / 2} 0 L ${this.ICON_WIDTH} ${this.ICON_HEIGHT} L 0 ${this.ICON_HEIGHT} Z`
		);
		return path;
	}

	step(x: number, y: number) {
		super.step(x, y);
		this.ctx!.clearRect(0, 0, this.ctx!.canvas.width, this.ctx!.canvas.height);

		this.ctx!.beginPath();
		this.ctx!.moveTo(this.startX + (x - this.startX) / 2, this.startY);
		this.ctx!.lineTo(x, y);
		this.ctx!.lineTo(this.startX, y);
		this.ctx!.closePath();

		this.ctx![this.outline ? "stroke" : "fill"]();
	}
}

export class Fill extends Tool {
	color?: string;

	/**
	 * If worker works too long,
	 * app will show loading.
	 * 
	 * This property holds the timeout
	 * necessary to the effect described above.
	 */
	done = NaN;

	end(ctx: CanvasRenderingContext2D) {
		const data = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);

		this.done = window.setTimeout(
			() => {
				if (!this.done) {
					app.showLoader("Filling");
				}
			},
			500
		);

		this.worker.postMessage({
			data,
			color: this.color,
			x: this.lastX,
			y: this.lastY,
		});
	}

	start(ctx: CanvasRenderingContext2D, color: string, x: number, y: number) {
		this.ctx = ctx;
		this.color = color;
		this.lastX = x;
		this.lastY = y;
	}

	*select() {
		this.button.classList.add("selected");
	}

	worker = new Worker(new URL("./assets/fill.worker.ts", import.meta.url));

	constructor() {
		super("Fill area with the same color", {
			alt: "Fill",
			src: fill
		});

		this.worker.onmessage = e => {
			this.ctx!.putImageData(e.data, 0, 0);
			window.clearTimeout(this.done);
			app.hideLoader();
		};

		this.movable = false;
	}
}

export class Eraser extends DrawingTool {
	step(x: number, y: number) {
		this.ctx!.globalCompositeOperation = 'destination-out';
		super.step(x, y);
	}

	constructor() {
		super("Erase pixels", {
			alt: "Eraser",
			src: eraser
		});
		// Modify the canvas directly
		this.movable = false;
	}

	end(ctx: CanvasRenderingContext2D) {
		ctx.globalCompositeOperation = 'source-over';

		this.startX = NaN;
		this.startY = NaN;
		this.lastX = NaN;
		this.lastY = NaN;
		this.ctx = undefined;

		return false;
	}
}

export class Select extends Tool {
	*select(): Generator<Node> {
		this.button.classList.add("selected");
	}

	start(ctx: CanvasRenderingContext2D, _color: string, x: number, y: number) {
		this.startX = x;
		this.startY = y;
		this.ctx = ctx;

		ctx.strokeStyle = "grey";
		ctx.lineWidth = 2;
		ctx.setLineDash([3]);
	}

	end(ctx: CanvasRenderingContext2D) {
		this.ctx!.clearRect(0, 0, this.ctx!.canvas.width, this.ctx!.canvas.height);
		this.ctx!.drawImage(ctx.canvas, 0, 0);
		ctx.clearRect(
			Math.min(this.startX, this.lastX),
			Math.min(this.startY, this.lastY),
			Math.abs(this.lastX - this.startX),
			Math.abs(this.lastY - this.startY)
		);
	}

	step(x: number, y: number) {
		this.ctx!.clearRect(0, 0, this.ctx!.canvas.width, this.ctx!.canvas.height);
		this.ctx!.strokeRect(
			this.startX,
			this.startY,
			(this.lastX = x) - this.startX,
			(this.lastY = y) - this.startY
		);
	}

	constructor() {
		super("Select an area", {
			alt: "Select",
			src: marquee
		});
	}
}