import hljs from "highlight.js/lib/core";
import "highlight.js/styles/atom-one-light.css";
import javascript from "highlight.js/lib/languages/javascript";
import type TabComponent from "../tab";
import type {App} from "../app";
import type {Entity} from "../entities";

hljs.registerLanguage("javascript", javascript);

export default class Code implements TabComponent {
	container = document.createElement("code");
	textarea = document.createElement("textarea");
	entity!: Entity;

	constructor(readonly app: App) {
		this.container.classList.add("code", "hljs", "tab-content");
		this.textarea.classList.add("tab-content");

		this.textarea.addEventListener("input", () => {
			this.container.innerHTML = hljs.highlight(
				this.entity.code = this.textarea.value, 
				{language: "javascript"}
			).value;
		});

		this.textarea.addEventListener("keydown", e => {
			if (e.key === "Tab") {
				e.preventDefault();
				const start = this.textarea.selectionStart;
				const end = this.textarea.selectionEnd;
				this.textarea.value = this.textarea.value.substring(0, start) + "\t" + this.textarea.value.substring(end);
				this.textarea.selectionStart = this.textarea.selectionEnd = start + 1;
			}
		});
	}

	render(entity: Entity, parent: HTMLElement) {
		parent.append(this.container, this.textarea);
		this.entity = entity;
	}

	update(entity: Entity) {
		this.entity = entity;
		this.textarea.value = entity.code;
		this.container.innerHTML = hljs.highlight(
			entity.code, 
			{language: "javascript"}
		).value;
	}

	dispose() {
		this.container.remove();
		this.textarea.remove();
	}
}
