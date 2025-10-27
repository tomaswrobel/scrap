/**
 * This file is a part of Scrap, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomaswrobel/scrap.
 *
 * @license MIT
 * @fileoverview Engine's sspeech bubble
 * @copyright Tomáš Wróbel 2025
 */
import {assert} from "@scrap/utils/assert";
import type Sprite from "./sprite";
import {bind} from "@scrap/utils/bind";

class TextUI {
	public element = document.createElement("div");
	private readonly sprite: Sprite;
	private readonly type: "ask" | "think" | "say";
	private readonly text: string;

	constructor(sprite: Sprite, type: "ask", text: string, askId: string);
	constructor(sprite: Sprite, type: "say" | "think", text: string);

	constructor(sprite: Sprite, type: "ask" | "think" | "say", text: string, askId?: string) {
		this.sprite = sprite;
		this.type = type;
		this.text = text;

		const x = sprite.x - sprite.width / 2;
		const y = -sprite.y - sprite.height / 2;

		window.addEventListener("resize", this.update);

		this.element.style.position = "absolute";
		this.element.append(text, document.createElement("br"));

		this.element.style.left = `${sprite.stage.width / 2 + x + sprite.width * 0.6}px`;
		this.element.style.top = `${
			sprite.stage.height / 2 + y - 80 - Math.floor(this.text.length / 30) * 16
		}px`;

		this.element.className = `blocklike-${type}`;

		if (type === "ask") {
			assert(askId, "Ask ID must be passed when using 'ask' type.");
			const form = document.createElement("form");

			const input = document.createElement("input");
			const btn = document.createElement("button");

			btn.type = "submit";
			btn.innerHTML = "&#x2713;";
			input.id = askId;

			form.action = `javascript:Scrap.answer("${askId}")`;

			form.append(input, btn);
			this.element.append(form);

			this.element.style.top = `${
				sprite.stage.height / 2 + y - 110 - Math.floor(this.text.length / 30) * 16
			}px`;
		}

		this.element.style.visibility = this.sprite.visible ? "visible" : "hidden";
		this.sprite.stage.element.insertBefore(this.element, this.sprite.element);
	}

	@bind
	update() {
		const x = this.sprite.x - this.sprite.width / 2;
		const y = -this.sprite.y - this.sprite.height / 2;

		this.element.style.left = `${
			this.sprite.stage.width / 2 + x + this.sprite.width * 0.6
		}px`;
		this.element.style.top = `${
			this.sprite.stage.height / 2 + y - 80 - Math.floor(this.text.length / 30) * 16
		}px`;

		if (this.type === "ask") {
			this.element.style.top = `${
				this.sprite.stage.height / 2 + y - 110 - Math.floor(this.text.length / 30) * 16
			}px`;
		}

		this.element.style.visibility = this.sprite.visible ? "visible" : "hidden";
	}

	delete() {
		this.element.remove();
		window.removeEventListener("resize", this.update);
	}
}

export default TextUI;
