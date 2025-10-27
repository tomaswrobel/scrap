/**
 * This file is a part of Scrap, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomaswrobel/scrap.
 *
 * @license MIT
 * @fileoverview Engine's stage
 * @copyright Tomáš Wróbel 2025
 */
import Costumes from "./costumes";
import {event, method} from "./decorators";
import Entity from "./entity";
import Sprite from "./sprite";
import {VariableType} from "./variables";

export default class Stage extends Entity {
	element = document.createElement("div");
	variableParent = document.createElement("div");
	flag = document.createElement("div");
	sprites: Sprite[] = [];

	readonly backdrop = new Costumes(this);

	width = window.innerWidth;
	height = window.innerHeight;

	keys: string[] = [];
	mouseDown = false;
	mouseX = NaN;
	mouseY = NaN;

	// oxlint-disable no-non-null-assertion
	ctx = document.createElement("canvas").getContext("2d")!;
	pen = document.createElement("canvas").getContext("2d")!;
	// oxlint-enable no-non-null-assertion

	constructor(options: Entity.Options) {
		super(options);
		this.variableParent.classList.add("scrap-variables");

		this.element.style.width = `${this.width}px`;
		this.element.style.height = `${this.height}px`;
		this.element.style.position = "absolute";
		this.element.style.overflow = "hidden";
		this.element.style.boxSizing = "border-box";

		const flagSize = 130;
		this.flag.style.width = `${flagSize}px`;
		this.flag.style.height = `${flagSize}px`;
		this.flag.style.position = "absolute";
		this.flag.style.left = this.flag.style.top = "50%";
		this.flag.style.transform = `translate(-${flagSize / 2}px, -${flagSize / 2}px)`;

		this.flag.className = "blocklike-flag";
		this.flag.innerHTML = "&#9873;";

		this.ctx.canvas.width = this.width;
		this.ctx.canvas.height = this.height;

		this.pen.canvas.width = this.width;
		this.pen.canvas.height = this.height;
		this.pen.canvas.style.pointerEvents = "none";

		this.pen.canvas.style.position = "absolute";
		this.ctx.canvas.style.position = "absolute";

		const flag = document.createElement("div");
		flag.style.width = `${this.width}px`;
		flag.style.height = `${this.height}px`;
		flag.style.position = "absolute";
		flag.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
		flag.style.zIndex = "10000";
		flag.style.display = "none";
		flag.appendChild(this.flag);

		this.element.appendChild(this.ctx.canvas);
		this.element.appendChild(this.pen.canvas);
		this.element.appendChild(this.variableParent);
		this.element.appendChild(flag);

		document.body.appendChild(this.element);

		// Events
		window.addEventListener(
			"keydown",
			e => {
				if (!this.keys.includes(e.key)) {
					this.keys.push(e.key);
				}
			},
			{signal: this.abort.signal},
		);

		window.addEventListener("resize", () => {
			this.width = window.innerWidth;
			this.height = window.innerHeight;
			this.element.style.width = `${this.width}px`;
			this.element.style.height = `${this.height}px`;

			flag.style.width = `${this.width}px`;
			flag.style.height = `${this.height}px`;
		});

		window.addEventListener(
			"keyup",
			e => {
				this.keys = this.keys.filter(key => key !== e.key);
			},
			{signal: this.abort.signal},
		);

		document.addEventListener(
			"mousemove",
			e => {
				this.mouseX = e.clientX - this.width / 2;
				this.mouseY = e.clientY - this.height / 2;
			},
			{signal: this.abort.signal},
		);

		document.addEventListener(
			"mousedown",
			() => {
				this.mouseDown = true;
			},
			{signal: this.abort.signal},
		);

		document.addEventListener(
			"mouseup",
			() => {
				this.mouseDown = false;
			},
			{signal: this.abort.signal},
		);

		this.update();
	}

	update() {
		const src = this.images[this.current];
		const img = new Image();

		img.onload = () => {
			this.ctx.filter = this.toFilter();
			this.ctx.drawImage(img, 0, 0, this.width, this.height);
		};

		img.src = src;
	}

	toggleFlag(hasFlag: boolean) {
		if (this.flag.parentElement) {
			this.flag.parentElement.style.display = hasFlag ? "block" : "none";
		}
	}

	@event
	async whenFlag(fn: Entity.Callback) {
		this.toggleFlag(true);

		this.flag.addEventListener(
			"click",
			() => {
				void fn(this);
				this.toggleFlag(false);
			},
			{once: true, signal: this.abort.signal},
		);
	}

	@method
	async switchBackdropTo(value: string | number) {
		const name = typeof value === "number" ? Object.keys(this.images)[value] : value;
		const detail = this.generateID();
		this.current = name;
		this.getBackdrops().dispatchEvent(new CustomEvent(name, {detail}));
		this.update();
		return detail;
	}

	private refreshSprites() {
		this.sprites.forEach((sprite, i) => {
			sprite.element.style.zIndex = `${i}`;
			sprite.update();
		});
	}

	sendSpriteBackwards(sprite: Sprite) {
		const index = this.sprites.indexOf(sprite);
		if (index > 0) {
			this.sprites[index] = this.sprites[index - 1]; // move one up
			this.sprites[index - 1] = sprite; // me subject down
		}
		this.refreshSprites();
	}

	sendSpriteForward(sprite: Sprite) {
		const index = this.sprites.indexOf(sprite);
		if (index < this.sprites.length - 1 && index !== -1) {
			this.sprites[index] = this.sprites[index + 1]; // move one down
			this.sprites[index + 1] = sprite; // me subject up
		}
		this.refreshSprites();
	}

	sendSpriteToFront(sprite: Sprite) {
		const index = this.sprites.indexOf(sprite);
		if (index !== -1) {
			this.sprites.splice(index, 1); // remove
			this.sprites.push(sprite); // add to end
		}
		this.refreshSprites();
	}

	sendSpriteToBack(sprite: Sprite) {
		const index = this.sprites.indexOf(sprite);
		if (index !== -1) {
			this.sprites.splice(index, 1); // remove
			this.sprites.unshift(sprite); // add to beginning
		}
		this.refreshSprites();
	}

	@method
	async isKeyPressed(key: string) {
		if (key === "any") {
			return Boolean(this.keys.length);
		}
		return this.keys.includes(key);
	}

	private *allVariables() {
		yield* this.variables;

		for (const sprite of this.sprites) {
			yield* sprite.variables;
		}
	}

	private makeWatchVariable(value: unknown): Node | string {
		if (value instanceof Sprite) {
			const img = document.createElement("img");
			img.src = value.images[value.costume.index];
			img.style.maxWidth = "50px";
			img.style.maxHeight = "50px";
			img.alt = "";
			return img;
		}

		if (Array.isArray(value)) {
			if (!value.length) {
				return "[]";
			}

			const list = document.createElement("div");
			list.classList.add("scrap-list");
			for (let i = 0; i < value.length; i++) {
				list.appendChild(this._variable(`${i}`, value[i]));
			}
			return list;
		}

		if (value instanceof Date) {
			return value.toLocaleDateString();
		}

		return String(value);
	}

	private _value(dom: Node | string) {
		const value = document.createElement("div");
		value.classList.add("scrap-value");
		value.append(dom);
		return value;
	}

	private _variable(name: string, value: any) {
		const div = document.createElement("div");
		div.classList.add("scrap-variable");

		const span = document.createElement("span");
		span.textContent = name;

		div.appendChild(span);
		div.appendChild(this._value(this.makeWatchVariable(value)));

		return div;
	}

	override updateVariables() {
		this.variableParent.innerHTML = "";

		for (const [name, variable] of this.allVariables()) {
			if (variable.visible) {
				const div = this._variable(name, variable.value);

				if (variable.types.includes(VariableType.Number)) {
					const slider = document.createElement("input");

					slider.type = "range";
					slider.min = `${variable.value - 100}`;
					slider.max = `${variable.value + 100}`;
					slider.value = `${variable.value}`;
					slider.classList.add("scrap-slider");

					slider.oninput = () => {
						variable.value = Number(slider.value);
						div.replaceChild(
							this._value(this.makeWatchVariable(slider.value)),
							div.querySelector(".scrap-value") as HTMLDivElement,
						);
					};

					div.ondblclick = () => div.classList.toggle("has-slider");
					div.appendChild(slider);
				}

				this.variableParent.appendChild(div);
			}
		}
	}

	[Symbol.toStringTag] = "Stage";
}
