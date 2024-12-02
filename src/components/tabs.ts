/**
 * This file is a part of Scrap Native, an app for helping to migrate
 * from block-based programming into text-based programming languages.
 *
 * You should have received a copy of the MIT License, if not, please
 * visit https://opensource.org/licenses/MIT. To verify the code, visit
 * the official repository at https://github.com/tomas-wrobel/scrap.
 *
 * @license MIT
 * @copyright Tomáš Wróbel 2024
 * @fileoverview Tabs manager
 */
import {Visibility} from "./visibility";
import TabComponent from "./tab";
import "./tabs.scss";

import Dialog from "@scrap/utils/dialog";

export default class Tabs {
	public active: TabComponent;
	private readonly root = document.getElementById("tabs")!;
	private readonly buttons: Record<string, HTMLButtonElement> = {};

	/**
	 * Create a new tab bar.
	 *
	 * @param components The components to be displayed in the tab bar. At least one component is required.
	 */
	constructor(...components: [TabComponent, ...TabComponent[]]) {
		for (let i = 0; i < components.length; i++) {
			const button = document.createElement("button");
			button.onclick = this.click(components[i]);
			const {name} = components[i];
			button.type = "button";
			button.title = `${name} tab`;
			button.innerText = name;
			this.buttons[name] = button;
			this.root.appendChild(button);
		}

		this.active = components[0];
		this.active.render();
		this.buttons[this.active.name].classList.add("selected");
	}

	public async set(component: TabComponent) {
		if (component === this.active) {
			component.update();
			return;
		}

		if (component.prerender) {
			try {
				await component.prerender();
			} catch (error) {
				console.error(error);
				await Dialog.scrap.fire({
					title: "Error",
					body: String(error),
					input: "none",
				});
				return;
			}
		}

		this.active.dispose();
		this.active = component;
		this.active.render();

		this.root.querySelector(".selected")?.classList.remove("selected");
		this.buttons[component.name].classList.add("selected");
	}

	private click(component: TabComponent) {
		return () => {
			if (this.active === component) {
				return;
			}

			this.set(component);
		};
	}

	/**
	 * Effects currently do this:
	 *
	 * - Hide the active tab, show {@link Hidden placeholder}
	 * - Restore the active tab
	 */
	public readonly effects = new Visibility(this);
}
