/**
 * This file is a part of Scrap, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomaswrobel/scrap.
 *
 * @license MIT
 * @fileoverview Engine's Sprite
 * @copyright Tomáš Wróbel 2025
 */
import {assert} from "@scrap/utils/assert.ts";
import Costume from "./costume";
import Costumes from "./costumes";
import {event, method, paced} from "./decorators";
import Entity from "./entity";
import {target} from "./form";
import type Stage from "./stage";
import TextUI from "./textui";
import {StopError} from "./utils";

// oxlint-disable-next-line no-unsafe-declaration-merging
class Sprite extends Entity {
	element = document.createElement("div");
	costumes = new Map<string, Costume>();
	img = new Image();
	public stage!: Stage;

	public onload?: Entity.Callback;
	public done = false;

	public id = this.generateID();

	public readonly costume = new Costumes(this);
	get backdrop() {
		return this.stage.backdrop;
	}

	// Pen
	public isPenDown = false;
	public penSize = 1;
	public penColor = "#222222";

	textUi?: TextUI;

	constructor({
		x = 0,
		y = 0,
		rotationStyle = 0,
		draggable = false,
		direction = 90,
		visible = true,
		size = 100,
		...entity
	}: Sprite.Options) {
		super(entity);

		this.img.alt = "";
		this.img.draggable = false;
		this.img.src = entity.images[this.current];

		// Initialize
		this.x = x;
		this.y = y;
		this.draggable = draggable;
		this.direction = direction;
		this.visible = visible;
		this.size = size;
		this.rotationStyle = rotationStyle;

		// Set up costumes
		for (const key in entity.images) {
			this.costumes.set(key, new Costume(entity.images[key]));
		}

		this.updateXY = Sprite.updateXY.bind(this);
		window.addEventListener("resize", this.updateXY);

		this.element.style.transformOrigin = "center center";
		this.element.style.position = "absolute";
		this.img.style.width = "100%";
		this.img.style.height = "100%";
		this.img.style.position = "absolute";
		this.element.style.position = "absolute";
		this.element.appendChild(this.img);
	}

	private async load() {
		for (const costume of this.costumes.values()) {
			await costume.load();
		}

		this.done = true;
		await this.onload?.(this);
		this.update();
	}

	@event
	override async whenLoaded(fn: Entity.Callback) {
		if (this.done) {
			window.setTimeout(fn, 0, this);
		} else if (this.onload) {
			const loader = this.onload;
			this.onload = async () => {
				await loader(this);
				await fn(this);
			};
		} else {
			this.onload = fn;
		}
	}

	private updateCostume() {
		const costume = this.costumes.get(this.current);
		assert(costume);

		if (this.img.src !== costume.src) {
			this.img.src = costume.src;
		}
	}

	private updateSize() {
		this.element.style.width = `${this.width}px`;
		this.element.style.height = `${this.height}px`;
	}

	private static updateXY(this: Sprite) {
		const x = this.x - this.width / 2;
		const y = -this.y - this.height / 2;

		this.element.style.left = `${x + this.stage.width / 2}px`;
		this.element.style.top = `${y + this.stage.height / 2}px`;
	}

	private updateFilter() {
		this.element.style.filter = this.toFilter();
	}

	private updateVisibility() {
		this.element.style.visibility = this.visible ? "visible" : "hidden";
	}

	private updateRotation() {
		if (this.rotationStyle === 0) {
			this.element.style.transform = `rotate(${this.direction - 90}deg)`;
		}

		if (this.rotationStyle === 1) {
			this.element.style.transform = `scaleX(${(Math.floor(this.direction / 180) * 2 - 1) * -1})`;
		}

		if (this.rotationStyle === 2) {
			this.element.style.transform = "";
		}
	}

	private updateDraggable() {
		if (this.draggable) {
			this.element.addEventListener("mousedown", this, {signal: this.abort.signal});
		} else {
			this.element.removeEventListener("mousedown", this);
		}
	}

	update() {
		this.updateCostume();
		this.updateDraggable();
		this.updateFilter();
		this.updateRotation();
		this.updateSize();
		this.updateVisibility();
		this.updateXY();

		this.textUi?.update();
	}

	/**
	 * The callback for dragging the sprite.
	 * It's not intended to be called directly.
	 * @param e Inserted by the event listener.
	 */
	handleEvent(e: MouseEvent) {
		const {clientX: startX, clientY: startY} = e;
		const {x, y} = this;

		// Make the sprite appear on top of other sprites
		this.element.style.zIndex = "100";

		// Create a shadow of the sprite
		const image = new Image();
		image.src = this.img.src;

		image.style.width = "100%";
		image.style.height = "100%";
		image.style.position = "absolute";
		image.style.transform = "translate(2px, 2px)";
		image.style.filter = "brightness(0) opacity(0.5)";

		this.element.insertBefore(image, this.img);

		const mousemove = (e: MouseEvent) => {
			this.x = x + e.clientX - startX;
			this.y = y - e.clientY + startY;

			// In case the image is changed
			// while dragging
			if (this.img.src !== image.src) {
				image.src = this.img.src;
				this.updateSize();
			}

			this.updateXY();
			this.textUi?.update();
		};

		const mouseup = () => {
			window.removeEventListener("mousemove", mousemove);
			window.removeEventListener("mouseup", mouseup);
			this.element.removeChild(image);
		};

		window.addEventListener("mousemove", mousemove);
		window.addEventListener("mouseup", mouseup);
	}

	addTo(stage: Stage) {
		this.stage = stage;
		stage.sprites.push(this);
		stage.element.appendChild(this.element);
		return this.load();
	}

	switchBackdropTo(value: string | number) {
		return this.stage.switchBackdropTo(value);
	}

	@event
	async whenFlag(fn: Entity.Callback) {
		this.stage.toggleFlag(true);

		this.stage.flag.addEventListener(
			"click",
			() => {
				void fn(this);
				this.stage.toggleFlag(false);
			},
			{once: true, signal: this.abort.signal},
		);
	}

	@method
	async delete() {
		this.stage.sprites = this.stage.sprites.filter(sprite => sprite !== this);
		this.stage.element.removeChild(this.element);
	}

	@method
	async clone() {
		const clone = new Sprite({
			x: this.x,
			y: this.y,
			direction: this.direction,
			draggable: this.draggable,
			visible: this.visible,
			size: this.size,
			rotationStyle: this.rotationStyle,
			current: this.costume.index,
			images: this.images,
			sounds: this.sounds,
		});

		clone.variable = this.variable.bind(this);
		clone.id = this.id;
		await clone.addTo(this.stage);

		document.dispatchEvent(new CustomEvent("ScrapSpriteClone", {detail: clone}));
	}

	@method
	async setDraggable(draggable: boolean) {
		this.draggable = draggable;
		this.updateDraggable();
	}

	@event
	async whenCloned(fn: Entity.Callback) {
		document.addEventListener(
			"ScrapSpriteClone",
			e => {
				if (e.detail.id === this.id) {
					void e.detail.whenLoaded(fn);
					e.stopPropagation();
				}
			},
			{signal: this.abort.signal},
		);
	}

	private motion(x: number, y: number) {
		const prevX = this.x;
		const prevY = this.y;

		this.x = x;
		this.y = y;

		if (this.isPenDown) {
			this.stage.pen.beginPath();
			this.stage.pen.moveTo(
				this.stage.width / 2 + this.x,
				this.stage.height / 2 + this.y * -1,
			);
			this.stage.pen.lineTo(
				this.stage.width / 2 + prevX,
				this.stage.height / 2 + prevY * -1,
			);
			this.stage.pen.lineWidth = this.penSize;
			this.stage.pen.strokeStyle = this.penColor;
			this.stage.pen.stroke();
		}

		this.updateXY();
		this.textUi?.update();
	}

	/**
	 * Moves the sprite for the specified number of seconds so it arrives at specified location when time is up.
	 * @param seconds time to glide
	 * @param x the x coordinate to glide to
	 * @param y the y coordinate to glide to
	 * @returns a promise that resolves when the glide is done
	 */
	// No decorator! The stop logic is handled in the method itself.
	glide(seconds: number, x: number, y: number) {
		return new Promise<void>((resolve, reject) => {
			const controller = new AbortController();

			let i = 0;
			const framesPerSecond = 1000 / this.pace;
			const stepX = (x - this.x) / (seconds * framesPerSecond);
			const stepY = (y - this.y) / (seconds * framesPerSecond);

			const int = setInterval(() => {
				i++;
				this.motion(this.x + stepX, this.y + stepY);
				if (i / framesPerSecond >= seconds) {
					clearInterval(int);
					this.motion(x, y);
					controller.abort();
					resolve();
				}
			}, this.pace);

			window.addEventListener(
				"message",
				function stop(e) {
					if (e.data === "STOP") {
						clearInterval(int);
						window.removeEventListener("message", stop);
						reject(new StopError());
					}
				},
				{signal: controller.signal},
			);
		});
	}

	@paced
	async move(steps: number) {
		const TO_RADIANS = Math.PI / 180;

		const dx = steps * Math.cos((this.direction - 90) * TO_RADIANS);
		const dy = steps * Math.sin((this.direction + 90) * TO_RADIANS);

		this.motion(this.x + Math.round(dx), this.y + Math.round(dy));
	}

	@paced
	async goTo(x: number, y: number) {
		this.motion(x, y);
	}

	@paced
	async goTowards(sprite: Sprite) {
		this.motion(sprite.x, sprite.y);
	}

	@paced
	async setX(x: number) {
		this.motion(x, this.y);
	}

	@paced
	async setY(y: number) {
		this.motion(this.x, y);
	}

	@paced
	async changeX(x: number) {
		this.motion(this.x + x, this.y);
	}

	@paced
	async changeY(y: number) {
		this.motion(this.x, this.y + y);
	}

	@paced
	async pointInDirection(direction: number) {
		if (direction > 0) {
			this.direction = direction % 360;
		} else {
			this.direction = (direction + 360 * 10) % 360;
		}
		this.updateRotation();
	}

	@paced
	async pointTowards(sprite: Sprite) {
		this.direction = Sprite.computeDirectionTo(this.x, this.y, sprite.x, sprite.y);
		this.updateRotation();
	}

	private static computeDirectionTo(fromX: number, fromY: number, toX: number, toY: number) {
		const result =
			((180 / Math.PI) * Math.atan((fromX - toX) / (fromY - toY)) +
				90 * (Math.sign(fromY - toY) + 1) +
				360) %
			360;

		if (fromY === toY) {
			return result + 90;
		}

		return result;
	}

	@paced
	async pointTo(x: number, y: number) {
		this.direction = Sprite.computeDirectionTo(this.x, this.y, x, y);
		this.updateRotation();
	}

	@paced
	async turnLeft(degrees: number) {
		this.direction = (this.direction + degrees) % 360;
		this.updateRotation();
	}

	@paced
	async turnRight(degrees: number) {
		this.direction = (this.direction + 360 - degrees) % 360;
		this.updateRotation();
	}

	@method
	async setRotationStyle(style: 0 | 1 | 2 | "left-right" | "don't rotate" | "all around") {
		if (style === "all around") {
			this.rotationStyle = 0;
		} else if (style === "left-right") {
			this.rotationStyle = 1;
		} else if (style === "don't rotate") {
			this.rotationStyle = 2;
		} else {
			this.rotationStyle = style;
		}
		this.updateRotation();
	}

	@method
	async ifOnEdgeBounce() {
		const nearestEdge = this.touchingEdge();

		if (!nearestEdge) {
			return;
		}

		const radians = ((90 - this.direction) * Math.PI) / 180;

		let dx = Math.cos(radians);
		let dy = -Math.sin(radians);
		if (nearestEdge === "left") {
			dx = Math.max(0.2, Math.abs(dx));
		} else if (nearestEdge === "top") {
			dy = Math.max(0.2, Math.abs(dy));
		} else if (nearestEdge === "right") {
			dx = 0 - Math.max(0.2, Math.abs(dx));
		} else if (nearestEdge === "bottom") {
			dy = 0 - Math.max(0.2, Math.abs(dy));
		}

		const degrees = (Math.atan2(dy, dx) * 180) / Math.PI;
		this.direction = (360 - degrees + 90) % 360;
		this.updateRotation();
	}

	@method
	async goForward() {
		this.stage.sendSpriteForward(this);
	}

	@method
	async goBackward() {
		this.stage.sendSpriteBackwards(this);
	}

	@method
	async goToFront() {
		this.stage.sendSpriteToFront(this);
	}

	@method
	async goToBack() {
		this.stage.sendSpriteToBack(this);
	}

	@method
	async switchCostumeTo(value: string | number) {
		const name = typeof value === "number" ? Object.keys(this.images)[value] : value;
		this.current = name;
		this.updateCostume();
		this.updateSize();
		this.textUi?.update();
	}

	@method
	async nextCostume() {
		const costumes = [...this.costumes.keys()];
		const index = costumes.indexOf(this.current);
		const next = costumes[index + 1] ?? costumes[0];

		await this.switchCostumeTo(next);
	}

	@method
	async show() {
		this.visible = true;
		this.updateVisibility();
	}

	@method
	async hide() {
		this.visible = false;
		this.updateVisibility();
	}

	@paced
	async setSize(size: number) {
		this.size = size;
		this.updateSize();
	}

	@paced
	async changeSize(size: number) {
		this.size += size;
		this.updateSize();
	}

	@method
	async think(contents: unknown) {
		const text = String(contents);

		if (this.textUi) {
			this.textUi.delete();
		}

		if (!text) {
			delete this.textUi;
			return;
		}

		this.textUi = new TextUI(this, "think", text);
	}

	@method
	async say(contents: unknown) {
		const text = String(contents);

		if (this.textUi) {
			this.textUi.delete();
		}

		if (!text) {
			delete this.textUi;
			return;
		}

		this.textUi = new TextUI(this, "say", text);
	}

	@method
	async thinkWait(contents: unknown, seconds: number) {
		await this.think(contents);
		await this.wait(seconds);
		await this.think("");
	}

	@method
	async sayWait(contents: unknown, seconds: number) {
		await this.say(contents);
		await this.wait(seconds);
		await this.say("");
	}

	@method
	async ask(contents: unknown) {
		const askId = this.generateID();
		const text = String(contents);

		this.textUi?.delete();
		this.textUi = new TextUI(this, "ask", text, askId);

		return new Promise<string>((resolve, reject) => {
			const stop = () => {
				this.abort.signal.removeEventListener("abort", stop);
				this.textUi?.delete();
				delete this.textUi;
				reject(new StopError());
			};

			target.addEventListener(
				askId,
				e => {
					this.abort.signal.removeEventListener("abort", stop);
					const {detail} = e as CustomEvent<string>;
					this.textUi?.delete();
					delete this.textUi;
					resolve(detail);
				},
				{once: true, signal: this.abort.signal},
			);

			this.abort.signal.addEventListener("abort", stop);
		});
	}

	@method
	async penClear() {
		this.stage.pen.clearRect(0, 0, this.stage.width, this.stage.height);
	}

	@method
	stamp() {
		if (!this.visible) {
			return Promise.resolve();
		}

		return new Promise<void>((resolve, reject) => {
			const costume = this.costumes.get(this.current);
			assert(costume);

			this.stage.pen.save();
			this.stage.pen.filter = this.toFilter();

			const {x, y, stage, rotationStyle, direction, width, height} = this;

			const imgX = x + stage.width / 2;
			const imgY = stage.height / 2 - y;
			const radians = (((direction - 90 + 360) % 360) * Math.PI) / 180;

			if (rotationStyle === 0) {
				this.stage.pen.translate(imgX, imgY);
				this.stage.pen.rotate(radians);
			} else if (rotationStyle === 1) {
				this.stage.pen.scale((Math.floor(this.direction / 180) * 2 - 1) * -1, 1);
			}

			const image = new Image();

			image.onload = () => {
				this.stage.pen.drawImage(
					image,
					0,
					0,
					image.width,
					image.height,
					-width / 2,
					-height / 2,
					width,
					height,
				);
				this.stage.pen.restore();
				resolve();
			};

			image.onerror = reject;
			image.src = costume.src;
		});
	}

	@method
	async penDown() {
		this.isPenDown = true;
	}

	@method
	async penUp() {
		this.isPenDown = false;
	}

	@method
	async setPenColor(color: string) {
		this.penColor = color;
	}

	@method
	async setPenSize(size: number) {
		this.penSize = size;
	}

	@method
	async changePenSize(size: number) {
		this.penSize += size;
	}

	@method
	async distanceTo(x: number, y: number) {
		return Math.sqrt((this.x - x) ** 2 + (this.y - y) ** 2);
	}

	private touchingEdge() {
		const {width, height, x, y} = this;

		if (x + width / 2 > this.stage.width / 2) {
			return "right";
		}
		if (x - width / 2 < -1 * (this.stage.width / 2)) {
			return "left";
		}
		if (y + height / 2 > this.stage.height / 2) {
			return "top";
		}
		if (y - height / 2 < -1 * (this.stage.height / 2)) {
			return "bottom";
		}

		return null;
	}

	@method
	async isTouchingMouse() {
		const {width, height, x, y, mouseX, mouseY} = this;

		return (
			mouseX > x - width / 2 &&
			mouseX < x + width / 2 &&
			mouseY > y - height / 2 &&
			mouseY < y + height / 2
		);
	}

	@method
	async isTouchingEdge() {
		return Boolean(this.touchingEdge());
	}

	@method
	async isTouching(sprite: Sprite) {
		const {width, height} = this;
		const {width: spriteWidth, height: spriteHeight} = sprite;

		return (
			this.x + width / 2 > sprite.x - spriteWidth / 2 &&
			this.x - width / 2 < sprite.x + spriteWidth / 2 &&
			this.y + height / 2 > sprite.y - spriteHeight / 2 &&
			this.y - height / 2 < sprite.y + spriteHeight / 2
		);
	}

	@method
	async isTouchingBackdropColor(color: string) {
		const {width, height} = this;

		const x = Math.round(this.x - this.stage.width / 2);
		const y = Math.round(this.stage.height / 2 - this.y);

		const {data} = this.stage.ctx.getImageData(x, y, width, height);

		const r = Number.parseInt(color.slice(1, 3), 16);
		const g = Number.parseInt(color.slice(3, 5), 16);
		const b = Number.parseInt(color.slice(5, 7), 16);

		for (let i = 0; i < data.length; i += 4) {
			if (data[i] === r && data[i + 1] === g && data[i + 2] === b && data[i + 3] !== 0) {
				return true;
			}
		}

		return false;
	}

	@method
	async isKeyPressed(key: string) {
		if (key === "any") {
			return Boolean(this.stage.keys.length);
		}
		return this.stage.keys.includes(key);
	}

	get mouseX() {
		return this.stage.mouseX;
	}

	get mouseY() {
		return this.stage.mouseY;
	}

	get mouseDown() {
		return this.stage.mouseDown;
	}

	override updateVariables() {
		this.stage.updateVariables();
	}

	get width() {
		const costume = this.costumes.get(this.current);
		assert(costume);
		return costume.width * (this.size / 100);
	}

	get height() {
		const costume = this.costumes.get(this.current);
		assert(costume);
		return costume.height * (this.size / 100);
	}

	[Symbol.toStringTag] = "Sprite";

	override variable(name: string) {
		return this.variables.get(name) ?? this.stage.variable(name);
	}
}

declare namespace Sprite {
	export interface Init {
		draggable: boolean;
		x: number;
		y: number;
		direction: number;
		visible: boolean;
		size: number;
		rotationStyle: 0 | 1 | 2;
	}

	export type Options = Partial<Init> & Entity.Options;
}

interface Sprite extends Sprite.Init {
	updateXY(): void;
}

export default Sprite;
